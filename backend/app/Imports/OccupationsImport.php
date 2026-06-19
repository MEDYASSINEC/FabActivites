<?php
namespace App\Imports;

use App\Models\Project;
use App\Models\Activite;
use App\Models\Occupation;
use App\Models\Frequentation;
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

class OccupationsImport extends DefaultValueBinder implements WithMultipleSheets, SkipsUnknownSheets, WithEvents, WithCustomValueBinder, WithReadFilter
{
    public static $activitesCache = null;
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

    // Stores rows that were ignored because the project/activity was not registered in DB
    private $ignoredRows = [];

    public function bindValue(Cell $cell, $value): bool
    {
        if (is_string($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);
            return true;
        }
        return parent::bindValue($cell, $value);
    }

    public static function initCaches()
    {
        DB::disableQueryLog();

        // Load all activities
        self::$activitesCache = DB::table('activites')->pluck('id', 'nom')->toArray();
        self::$activitesCache = array_change_key_case(self::$activitesCache, CASE_LOWER);

        // Load all existing frequentations to link them
        self::$frequentationsCache = [];
        DB::table('frequentations')
            ->select('id', 'date', 'type_activite', 'project_id', 'activite_id')
            ->orderBy('id')
            ->chunk(2000, function ($rows) {
                foreach ($rows as $f) {
                    $projKey = $f->project_id ?: 0;
                    $actKey = $f->activite_id ?: 0;
                    $key = strtolower("{$f->date}_{$f->type_activite}_{$projKey}_{$actKey}");
                    OccupationsImport::$frequentationsCache[$key] = $f->id;
                }
            });

        self::$projectResolutionCache = [];
    }

    public static function clearCaches()
    {
        self::$activitesCache = null;
        self::$frequentationsCache = null;
        self::$projectResolutionCache = [];
        DB::enableQueryLog();
    }

    public function sheets(): array
    {
        $projects = Project::all(['id', 'intitule_projet']);
        self::initCaches();

        return [
            'Occupation'  => new OccupationsOnlySheetImport($projects, $this),
            'occupations' => new OccupationsOnlySheetImport($projects, $this),
            'Occupations' => new OccupationsOnlySheetImport($projects, $this),
        ];
    }

    public function onUnknownSheet($sheetName)
    {
        // Skip
    }

    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                $reader = $event->reader->getDelegate();
                $sheetNames = $reader->getSheetNames();

                // Validate that at least one Occupation sheet exists
                $expectedSheets = ['Occupation', 'occupations', 'Occupations'];
                $hasOcc = false;
                foreach ($expectedSheets as $exp) {
                    if (in_array($exp, $sheetNames)) {
                        $hasOcc = true;
                        break;
                    }
                }

                if (!$hasOcc) {
                    throw new \Exception(
                        "La feuille contenant les occupations est introuvable. " .
                        "Elle doit être nommée 'Occupation'. " .
                        "Feuilles trouvées dans le fichier : " . implode(', ', $sheetNames)
                    );
                }

                // Remove unused sheets from memory
                $sheetsToRemove = [];
                foreach ($sheetNames as $name) {
                    if (!in_array($name, $expectedSheets)) {
                        $sheetsToRemove[] = $name;
                    }
                }
                foreach ($sheetsToRemove as $name) {
                    $sheet = $reader->getSheetByName($name);
                    if ($sheet) {
                        $idx = $reader->getIndex($sheet);
                        $reader->removeSheetByIndex($idx);
                    }
                }
                gc_collect_cycles();
            },
            AfterImport::class => function (AfterImport $event) {
                $event->reader->getDelegate()->disconnectWorksheets();
                self::clearCaches();
                gc_collect_cycles();
            }
        ];
    }

    public function addIgnoredRow(array $row, string $reason)
    {
        $row['raison_rejet'] = $reason;
        $this->ignoredRows[] = $row;
    }

    public function getIgnoredRows(): array
    {
        return $this->ignoredRows;
    }
}

class OccupationsOnlySheetImport implements OnEachRow, WithHeadingRow
{
    protected $projects;
    protected $mainImporter;
    private static $rowCount = 0;

    public function __construct($projects, OccupationsImport $mainImporter)
    {
        $this->projects = $projects;
        $this->mainImporter = $mainImporter;
    }

    public function onRow(Row $row)
    {
        $rowArr = $row->toArray();

        // Skip completely empty rows
        if (empty($rowArr['date']) && empty($rowArr['nom_de_lactiviteprojet'] ?? $rowArr['nom_activite'] ?? $rowArr['projet'] ?? '')) {
            return;
        }

        self::$rowCount++;
        if (self::$rowCount % 200 === 0) {
            Log::info("Import Occupation : " . self::$rowCount . " lignes traitées...");
        }

        $date = $this->transformDate($rowArr['date'] ?? null);
        if (!$date) {
            $this->mainImporter->addIgnoredRow($rowArr, "Date invalide ou manquante");
            return;
        }

        $heur_debut = $this->transformTime($rowArr['heure_debut'] ?? $rowArr['heur_debut'] ?? null);
        $heur_fin = $this->transformTime($rowArr['heure_fin'] ?? $rowArr['heur_fin'] ?? null);

        // Resolve project or activity
        $projectName = trim($rowArr['nom_de_lactiviteprojet'] ?? $rowArr['nom_activite'] ?? $rowArr['projet'] ?? '');
        $projectId = null;
        $activiteId = null;

        if ($projectName === '') {
            $this->mainImporter->addIgnoredRow($rowArr, "Nom de projet/activité manquant");
            return;
        }

        $projectNameKey = strtolower($projectName);

        // 1. Try to resolve as a project in DB
        if (isset(OccupationsImport::$projectResolutionCache[$projectNameKey])) {
            $projectId = OccupationsImport::$projectResolutionCache[$projectNameKey];
        } else {
            $project = $this->projects->first(function ($p) use ($projectName) {
                return stripos($p->intitule_projet, $projectName) !== false
                    || stripos($projectName, $p->intitule_projet) !== false;
            });

            $projectId = $project ? $project->id : null;
            OccupationsImport::$projectResolutionCache[$projectNameKey] = $projectId;
        }

        // 2. Try to resolve as an activity in DB
        if (!$projectId) {
            $key = strtolower(trim($projectName));
            if (isset(OccupationsImport::$activitesCache[$key])) {
                $activiteId = OccupationsImport::$activitesCache[$key];
            }
        }

        // 3. If neither project nor activity is registered in DB, IGNORE this row!
        if (!$projectId && !$activiteId) {
            $this->mainImporter->addIgnoredRow($rowArr, "Projet/Activité non enregistré(e) en BDD");
            return;
        }

        $typeActivite = $rowArr['type_activite'] ?? 'Autre';
        $projKey = $projectId ?: 0;
        $actKey = $activiteId ?: 0;
        $cacheKey = strtolower("{$date}_{$typeActivite}_{$projKey}_{$actKey}");

        // Find existing frequentation from cache
        $frequentationId = null;
        if (isset(OccupationsImport::$frequentationsCache[$cacheKey])) {
            $frequentationId = OccupationsImport::$frequentationsCache[$cacheKey];
        } else {
            // Fallback: search for any frequentation on the same date for the same project/activity (regardless of type_activite)
            $fallbackPrefix = strtolower("{$date}_");
            $fallbackSuffix = strtolower("_{$projKey}_{$actKey}");

            foreach (OccupationsImport::$frequentationsCache as $k => $id) {
                if (str_starts_with($k, $fallbackPrefix) && str_ends_with($k, $fallbackSuffix)) {
                    $frequentationId = $id;
                    break;
                }
            }

            // Create a default frequentation if none exists on that day for that project/activity
            if (!$frequentationId) {
                $frequentationId = DB::table('frequentations')->insertGetId([
                    'date'           => $date,
                    'type_activite'  => $typeActivite,
                    'project_id'     => $projectId,
                    'activite_id'    => $activiteId,
                    'heur_debut'     => $heur_debut,
                    'heur_fin'       => $heur_fin,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
                OccupationsImport::$frequentationsCache[$cacheKey] = $frequentationId;
            }
        }

        // Insert occupation
        DB::table('occupations')->insert([
            'frequentation_id'  => $frequentationId,
            'zone_occupee'      => $rowArr['zone_occupee'] ?? null,
            'outillage_machine' => $rowArr['outillage_machine_utilisee'] ?? $rowArr['outillage_machine'] ?? null,
            'heur_debut'        => $heur_debut,
            'heur_fin'          => $heur_fin,
            'date'              => $date,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);
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
}
