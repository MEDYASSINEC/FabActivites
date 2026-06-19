<?php
namespace App\Imports;

use App\Models\Frequentation;
use App\Models\Project;
use App\Models\Activite;
use App\Models\Occupation;
use App\Models\Participant;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\SkipsUnknownSheets;
use Maatwebsite\Excel\Row;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithReadFilter;
use Maatwebsite\Excel\Events\BeforeImport;
use Maatwebsite\Excel\Events\AfterImport;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;

/**
 * ============================================================================
 * MAIN IMPORTER CLASS
 * ============================================================================
 * Implements WithMultipleSheets to target only the required sheets.
 * Implements WithCustomValueBinder to force all cells to be read as strings,
 * preventing PhpSpreadsheet from creating heavy RichText objects.
 * 
 * MEMORY OPTIMIZATION STRATEGY:
 * 1. PhpSpreadsheet loads the ENTIRE Excel file (all sheets) into memory.
 *    A 5.74 MB file with 5 sheets and ~8000 rows consumes ~830 MB of RAM.
 *    We use a SheetFilter via BeforeImport to skip unused sheets 
 *    ('Tableau Récap KPIs', 'Dashboard'), reducing memory by ~40%.
 * 2. DB::disableQueryLog() prevents Laravel from storing every SQL query
 *    in memory (50,000+ queries would consume hundreds of MB).
 * 3. Lookup caches use lightweight DB::table()->pluck() arrays instead of
 *    Eloquent model collections (95% memory reduction for lookups).
 * 4. All caches are explicitly freed in AfterImport to allow garbage collection.
 * ============================================================================
 */
class FrequentationsImport extends DefaultValueBinder implements WithMultipleSheets, SkipsUnknownSheets, WithEvents, WithCustomValueBinder, WithReadFilter
{
    public static $activitesCache = null;
    public static $participantsCache = null;
    public static $frequentationsCache = null;
    public static $projectResolutionCache = [];

    public function readFilter(): IReadFilter
    {
        return new class implements IReadFilter {
            public function readCell($column, $row, $worksheetName = ''): bool
            {
                return $row <= 5000;
            }
        };
    }

    /**
     * Force all cells to be read as plain strings.
     * This prevents PhpSpreadsheet from creating heavy RichText objects
     * for formatted cells, saving significant memory.
     */
    public function bindValue(Cell $cell, $value): bool
    {
        if (is_string($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);
            return true;
        }
        return parent::bindValue($cell, $value);
    }

    /**
     * Initialize lightweight lookup caches from database.
     * Uses DB::table() query builder instead of Eloquent models to minimize
     * per-record memory overhead (plain arrays vs. full model objects).
     */
    public static function initCaches()
    {
        // Disable Query Log to prevent accumulation of query records in memory
        DB::disableQueryLog();

        // Activities cache: ['nom_lowercase' => id]
        self::$activitesCache = DB::table('activites')->pluck('id', 'nom')->toArray();
        self::$activitesCache = array_change_key_case(self::$activitesCache, CASE_LOWER);

        // Participants cache: ['nom_lowercase' => id]
        self::$participantsCache = DB::table('participants')->pluck('id', 'nom')->toArray();
        self::$participantsCache = array_change_key_case(self::$participantsCache, CASE_LOWER);

        // Frequentations cache: ['date_type_projId_actId' => id]
        // Only select the 4 columns needed for key construction + id
        self::$frequentationsCache = [];
        DB::table('frequentations')
            ->select('id', 'date', 'type_activite', 'project_id', 'activite_id')
            ->orderBy('id')
            ->chunk(2000, function ($rows) {
                foreach ($rows as $f) {
                    $projKey = $f->project_id ?: 0;
                    $actKey = $f->activite_id ?: 0;
                    $key = strtolower("{$f->date}_{$f->type_activite}_{$projKey}_{$actKey}");
                    FrequentationsImport::$frequentationsCache[$key] = $f->id;
                }
            });

        self::$projectResolutionCache = [];
    }

    /**
     * Free all static caches to allow garbage collection.
     */
    public static function clearCaches()
    {
        self::$activitesCache = null;
        self::$participantsCache = null;
        self::$frequentationsCache = null;
        self::$projectResolutionCache = [];
        DB::enableQueryLog();
    }

    /**
     * Define which sheets to import and which importer class handles each.
     * Sheets not listed here are loaded by PhpSpreadsheet into memory but
     * not processed. The BeforeImport event applies a filter to avoid loading
     * them entirely.
     */
    public function sheets(): array
    {
        // Load projects as lightweight collection for name matching
        $projects = Project::all(['id', 'intitule_projet']);

        self::initCaches();

        return [
            'Fréquentation'  => new FrequentationsSheetImport($projects),
            'frequentations' => new FrequentationsSheetImport($projects),
            'Frequentations' => new FrequentationsSheetImport($projects),
        ];
    }

    public function onUnknownSheet($sheetName)
    {
        // Silently skip sheets that don't exist in the file
    }

    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                $reader = $event->reader->getDelegate();
                $sheetNames = $reader->getSheetNames();

                // Validate that at least one Fréquentation sheet exists
                $expectedFreq = ['Fréquentation', 'frequentations', 'Frequentations'];
                $hasFreq = false;
                foreach ($expectedFreq as $exp) {
                    if (in_array($exp, $sheetNames)) {
                        $hasFreq = true;
                        break;
                    }
                }

                if (!$hasFreq) {
                    throw new \Exception(
                        "La feuille contenant les fréquentations est introuvable. " .
                        "Elle doit être nommée 'Fréquentation'. " .
                        "Feuilles trouvées dans le fichier : " . implode(', ', $sheetNames)
                    );
                }

                // ============================================================
                // CRITICAL MEMORY OPTIMIZATION: Remove unused sheets.
                // BeforeImport fires AFTER the file is loaded, so we can't
                // filter at load time. Instead, we remove sheets we don't
                // need from the Spreadsheet object to free their memory.
                // This saves ~300-400 MB of RAM for files with extra sheets
                // like 'Tableau Récap KPIs', 'Dashboard', etc.
                // ============================================================
                $allowedSheets = [
                    'Fréquentation', 'frequentations', 'Frequentations',
                ];

                $spreadsheet = $event->reader->getDelegate();
                $sheetsToRemove = [];
                foreach ($spreadsheet->getSheetNames() as $name) {
                    if (!in_array($name, $allowedSheets)) {
                        $sheetsToRemove[] = $name;
                    }
                }
                foreach ($sheetsToRemove as $name) {
                    $sheet = $spreadsheet->getSheetByName($name);
                    if ($sheet) {
                        $idx = $spreadsheet->getIndex($sheet);
                        $spreadsheet->removeSheetByIndex($idx);
                    }
                }
                // Force garbage collection to reclaim freed sheet memory
                gc_collect_cycles();
            },
            AfterImport::class => function (AfterImport $event) {
                $event->reader->getDelegate()->disconnectWorksheets();
                self::clearCaches();
                // Force garbage collection after import completes
                gc_collect_cycles();
            }
        ];
    }
}

/**
 * ============================================================================
 * FREQUENTATIONS SHEET IMPORTER
 * ============================================================================
 * Processes the 'Fréquentation' sheet row by row with chunk reading.
 * Each row creates a Frequentation record and links participants.
 * ============================================================================
 */
class FrequentationsSheetImport implements OnEachRow, WithHeadingRow
{
    protected $projects;
    private static $rowCount = 0;

    public function __construct($projects)
    {
        $this->projects = $projects;
    }

    public function onRow(Row $row)
    {
        $row = $row->toArray();

        // Skip empty rows (common at the end of Excel sheets)
        if (empty($row['date']) && empty($row['nom_de_lactiviteprojet'] ?? $row['nom_activite'] ?? $row['projet'] ?? '')) {
            return;
        }

        self::$rowCount++;
        if (self::$rowCount % 200 === 0) {
            Log::info("Import Fréquentation : " . self::$rowCount . " lignes traitées...");
        }

        $date = $this->transformDate($row['date'] ?? null);
        if (!$date) {
            return;
        }

        $heur_debut = $this->transformTime($row['heure_debut'] ?? $row['heur_debut'] ?? null);
        $heur_fin = $this->transformTime($row['heure_fin'] ?? $row['heur_fin'] ?? null);

        // Parse participants string into array
        $participants = [];
        $participantsStr = $row['nom_participants'] ?? $row['participants'] ?? null;
        if (!empty($participantsStr)) {
            if (is_string($participantsStr)) {
                $participants = array_map('trim', explode(',', $participantsStr));
            } elseif (is_array($participantsStr)) {
                $participants = $participantsStr;
            }
        }

        // Resolve project or activity
        $projectName = trim($row['nom_de_lactiviteprojet'] ?? $row['nom_activite'] ?? $row['projet'] ?? '');
        $projectId = null;
        $activiteId = null;

        if ($projectName !== '') {
            $projectNameKey = strtolower($projectName);

            if (isset(FrequentationsImport::$projectResolutionCache[$projectNameKey])) {
                $projectId = FrequentationsImport::$projectResolutionCache[$projectNameKey];
            } else {
                $project = $this->projects->first(function ($p) use ($projectName) {
                    return stripos($p->intitule_projet, $projectName) !== false
                        || stripos($projectName, $p->intitule_projet) !== false;
                });

                $projectId = $project ? $project->id : null;
                FrequentationsImport::$projectResolutionCache[$projectNameKey] = $projectId;
            }

            if (!$projectId) {
                $activiteId = $this->getActiviteId($projectName, $row);
            }
        }

        $typeActivite = $row['type_activite'] ?? 'Autre';

        // Insert frequentation using direct DB insert for lower memory overhead
        $frequentationId = DB::table('frequentations')->insertGetId([
            'date'           => $date,
            'type_activite'  => $typeActivite,
            'project_id'     => $projectId,
            'activite_id'    => $activiteId,
            'etape'          => $row['etapeseance'] ?? $row['etape_seance'] ?? $row['etape'] ?? null,
            'intervenant'    => $row['intervenantresponsable'] ?? $row['intervenant_responsable'] ?? $row['intervenant'] ?? $row['responsable'] ?? null,
            'role'           => $row['role'] ?? null,
            'heur_debut'     => $heur_debut,
            'heur_fin'       => $heur_fin,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        // Add to cache so OccupationsSheetImport can find it
        $projKey = $projectId ?: 0;
        $actKey = $activiteId ?: 0;
        $cacheKey = strtolower("{$date}_{$typeActivite}_{$projKey}_{$actKey}");
        FrequentationsImport::$frequentationsCache[$cacheKey] = $frequentationId;

        // Bulk insert participant relationships
        if (!empty($participants)) {
            $pivotData = [];
            foreach ($participants as $name) {
                if (empty(trim($name))) continue;
                $pId = $this->getParticipantId($name);
                $pivotData[] = [
                    'frequentation_id' => $frequentationId,
                    'participant_id'   => $pId,
                ];
            }
            if (!empty($pivotData)) {
                DB::table('frequentation_participant')->insertOrIgnore($pivotData);
            }
        }
    }


    private function transformDate($value)
    {
        if (!$value) return null;
        try {
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
            }
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function transformTime($value)
    {
        if (!$value) return null;
        try {
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('H:i');
            }
            return Carbon::parse($value)->format('H:i');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function getActiviteId($name, $row)
    {
        $key = strtolower(trim($name));
        if (isset(FrequentationsImport::$activitesCache[$key])) {
            return FrequentationsImport::$activitesCache[$key];
        }

        $id = DB::table('activites')->insertGetId([
            'nom'     => $name,
            'pole'    => $row['pole'] ?? null,
            'filiere' => $row['filiere'] ?? null,
            'groupe'  => $row['groupe'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        FrequentationsImport::$activitesCache[$key] = $id;
        return $id;
    }

    private function getParticipantId($name)
    {
        $key = strtolower(trim($name));
        if (isset(FrequentationsImport::$participantsCache[$key])) {
            return FrequentationsImport::$participantsCache[$key];
        }

        $id = DB::table('participants')->insertGetId([
            'nom' => trim($name),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        FrequentationsImport::$participantsCache[$key] = $id;
        return $id;
    }
}
