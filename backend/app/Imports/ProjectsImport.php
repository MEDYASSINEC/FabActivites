<?php
namespace App\Imports;

use App\Models\Project;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\SkipsUnknownSheets;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithReadFilter;
use Maatwebsite\Excel\Events\BeforeImport;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;

class ProjectsImport implements WithMultipleSheets, SkipsUnknownSheets, WithEvents, WithReadFilter
{
    public function readFilter(): IReadFilter
    {
        return new class implements IReadFilter {
            public function readCell($column, $row, $worksheetName = ''): bool
            {
                return $row <= 5000;
            }
        };
    }
    public function sheets(): array
    {
        return [
            'Liste de projets' => new ProjectsSheetImport(),
            'projets' => new ProjectsSheetImport(),
            'Projets' => new ProjectsSheetImport(),
        ];
    }

    public function onUnknownSheet($sheetName)
    {
        // Silently ignore sheet names that do not exist in the file
    }

    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function(BeforeImport $event) {
                // Disable Query Log during project import
                \Illuminate\Support\Facades\DB::disableQueryLog();

                $sheetNames = $event->reader->getDelegate()->getSheetNames();
                
                $expected = ['Liste de projets', 'projets', 'Projets'];
                $hasMatchingSheet = false;
                foreach ($expected as $exp) {
                    if (in_array($exp, $sheetNames)) {
                        $hasMatchingSheet = true;
                        break;
                    }
                }
                
                if (!$hasMatchingSheet) {
                    throw new \Exception("La feuille contenant la liste des projets est introuvable. Elle doit être nommée 'Liste de projets'. Feuilles trouvées dans le fichier : " . implode(', ', $sheetNames));
                }
            },
            \Maatwebsite\Excel\Events\AfterImport::class => function(\Maatwebsite\Excel\Events\AfterImport $event) {
                \Illuminate\Support\Facades\DB::enableQueryLog();
            }
        ];
    }
}

class ProjectsSheetImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        // Skip empty rows (e.g. at the bottom of the Excel sheet)
        if (empty($row['intitule_projet']) && empty($row['nom_du_projet']) && empty($row['responsable_de_projet']) && empty($row['responsable_projet']) && empty($row['responsable'])) {
            return null;
        }

        $dt_debut = $this->transformDate($row['date_debut'] ?? $row['dt_debut'] ?? null);
        $dt_fn_prevu = $this->transformDate($row['date_fin_prevue'] ?? $row['dt_fn_prevu'] ?? null);
        $dt_fn_reel = $this->transformDate($row['date_fin_reelle'] ?? $row['dt_fn_reel'] ?? null);
        $dt_suspension = $this->transformDate($row['date_suspension'] ?? $row['dt_suspension'] ?? null);
        $dt_abandon = $this->transformDate($row['date_abandon'] ?? $row['dt_abandon'] ?? null);

        $intitule = trim($row['intitule_projet'] ?? $row['nom_du_projet'] ?? 'Sans nom');

        // Validation to prevent SQL integrity errors and show a clean message
        $responsable = trim($row['responsable_de_projet'] ?? $row['responsable_projet'] ?? $row['responsable'] ?? '');
        if (empty($responsable)) {
            throw new \Exception("Le responsable de projet est obligatoire pour le projet '$intitule'.");
        }

        return Project::updateOrCreate(
            ['intitule_projet' => $intitule],
            [
                'source_du_projet'   => $row['source_du_projet'] ?? $row['source'] ?? null,
                'statut'             => $row['statut'] ?? 'En cours',
                'etape'              => $row['etape'] ?? null,
                'responsable_projet' => $responsable,
                'pole'               => $row['pole'] ?? null,
                'filiere'            => $row['filiere'] ?? null,
                'groupe'             => $row['groupe'] ?? null,
                'dt_debut'           => $dt_debut,
                'dt_fn_prevu'        => $dt_fn_prevu,
                'dt_fn_reel'         => $dt_fn_reel,
                'dt_suspension'      => $dt_suspension,
                'dt_abandon'         => $dt_abandon,
                'remarques'          => $row['remarques'] ?? null,
            ]
        );
    }

    private function transformDate($value)
    {
        if (!$value) return null;
        try {
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value);
            }
            return Carbon::parse($value);
        } catch (\Exception $e) {
            return null;
        }
    }
}
