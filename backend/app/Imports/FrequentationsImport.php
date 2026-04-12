<?php
namespace App\Imports;

use App\Models\Frequentation;
use App\Models\Project;
use App\Models\Activite;
use App\Models\Occupation;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class FrequentationsImport implements ToModel, WithHeadingRow, WithEvents, WithBatchInserts, WithChunkReading
{
    protected $projects;

    public function __construct()
    {
        // Load all projects once at the start to avoid N+1 queries
        $this->projects = Project::all();
    }

    public function model(array $row)
    {
        // Log headers only for the first row to help debug mapping
        static $headersLogged = false;
        if (!$headersLogged) {
            \Illuminate\Support\Facades\Log::info("Excel Headers detected: " . implode(', ', array_keys($row)));
            $headersLogged = true;
        }

        // Try to parse values safely
        $date = $this->transformDate($row['date'] ?? null);
        $heur_debut = $this->transformTime($row['heure_debut'] ?? $row['heur_debut'] ?? null);
        $heur_fin = $this->transformTime($row['heure_fin'] ?? $row['heur_fin'] ?? null);

        // Participants handling (only for the Frequentation record)
        $participants = [];
        if (isset($row['participants']) && !empty($row['participants'])) {
            if (is_string($row['participants'])) {
                $participants = array_map('trim', explode(',', $row['participants']));
            } elseif (is_array($row['participants'])) {
                $participants = $row['participants'];
            }
        }

        // Logic for project linking (using in-memory collection)
        $projectName = trim($row['nom_de_lactiviteprojet'] ?? $row['nom_activite'] ?? $row['projet'] ?? '');
        $projectId = null;
        $activiteId = null;

        if ($projectName !== '') {
            // Fuzzy match in memory
            $project = $this->projects->first(function($p) use ($projectName) {
                return stripos($p->intitule_projet, $projectName) !== false;
            });

            if ($project) {
                $projectId = $project->id;
            } else {
                // Check if activity already exists for this SPECIFIC name AND pole
                $activite = Activite::firstOrCreate([
                    'nom' => $projectName,
                    'pole' => $row['pole'] ?? null,
                ], [
                    'filiere' => $row['filiere'] ?? null,
                    'groupe' => $row['groupe'] ?? null,
                ]);
                $activiteId = $activite->id;
            }
        }

        // Create Occupation
        $occupationId = null;
        if (isset($row['zone_occupee']) || isset($row['outillage_machine'])) {
            $occupation = Occupation::create([
                'zone_occupee' => $row['zone_occupee'] ?? null,
                'outillage_machine' => $row['outillage_machine'] ?? null,
            ]);
            $occupationId = $occupation->id;
        }

        return new Frequentation([
            'date'           => $date,
            'type_activite'  => $row['type_activite'] ?? 'Autre',
            'project_id'     => $projectId,
            'activite_id'    => $activiteId,
            'occupation_id'  => $occupationId,
            'etape'          => $row['etape'] ?? null,
            'intervenant'    => $row['intervenant'] ?? $row['responsable'] ?? null,
            'role'           => $row['role'] ?? null,
            'participants'   => $participants,
            'heur_debut'     => $heur_debut,
            'heur_fin'       => $heur_fin,
        ]);
    }

    public function registerEvents(): array
    {
        return [
            AfterImport::class => function(AfterImport $event) {
                \Illuminate\Support\Facades\Log::info("Import completed successfully.");
            },
        ];
    }

    public function batchSize(): int
    {
        return 500;
    }

    public function chunkSize(): int
    {
        return 500;
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
