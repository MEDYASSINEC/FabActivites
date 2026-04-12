<?php
namespace App\Imports;

use App\Models\Project;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;

class ProjectsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        // Try to parse dates safely
        $dt_debut = $this->transformDate($row['date_debut'] ?? $row['dt_debut'] ?? null);
        $dt_fn_prevu = $this->transformDate($row['date_fin_prevue'] ?? $row['dt_fn_prevu'] ?? null);
        $dt_fn_reel = $this->transformDate($row['date_fin_reelle'] ?? $row['dt_fn_reel'] ?? null);

        // Participants handling (assuming comma separated string in Excel)
        $participants = [];
        if (isset($row['participants']) && !empty($row['participants'])) {
            if (is_string($row['participants'])) {
                $participants = array_map('trim', explode(',', $row['participants']));
            } elseif (is_array($row['participants'])) {
                $participants = $row['participants'];
            }
        }

        return Project::updateOrCreate(
            ['intitule_projet' => $row['intitule_projet'] ?? $row['nom_du_projet'] ?? 'Sans nom'],
            [
                'source_du_projet'   => $row['source_du_projet'] ?? $row['source'] ?? null,
                'statut'             => $row['statut'] ?? 'En cours',
                'etape'              => $row['etape'] ?? null,
                'responsable_projet' => $row['responsable_projet'] ?? $row['responsable'] ?? null,
                'pole'               => $row['pole'] ?? null,
                'filiere'            => $row['filiere'] ?? null,
                'groupe'             => $row['groupe'] ?? null,
                'participants'       => $participants,
                'dt_debut'           => $dt_debut,
                'dt_fn_prevu'        => $dt_fn_prevu,
                'dt_fn_reel'         => $dt_fn_reel,
                'remarques'          => $row['remarques'] ?? null,
            ]
        );
    }

    private function transformDate($value)
    {
        if (!$value) return null;
        try {
            return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value);
        } catch (\ErrorException $e) {
            try {
                return Carbon::parse($value);
            } catch (\Exception $e) {
                return null;
            }
        }
    }
}
