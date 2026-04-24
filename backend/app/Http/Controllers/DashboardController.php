<?php

namespace App\Http\Controllers;

use App\Support\FormationYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private function fromDate(Request $request): string
    {
        return $request->query('from', FormationYear::getFormationYearStart()->toDateString());
    }

    private function projectParticipantsExpression(): string
    {
        return "COALESCE(JSON_LENGTH(projects.participants), 0)";
    }

    private function activiteParticipantsExpression(): string
    {
        if (Schema::hasColumn('activites', 'nombre_participant')) {
            return 'COALESCE(activites.nombre_participant, 0)';
        }

        return 'COALESCE(frequentations.nb_participants, 0)';
    }

    public function projetsStatutsAnnee(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);

        $enCours = DB::table('projects')
            ->whereDate('dt_debut', '>=', $from)
            ->whereRaw("LOWER(statut) NOT IN ('terminé', 'termine')")
            ->count();

        $termines = DB::table('projects')
            ->whereDate('dt_debut', '>=', $from)
            ->whereRaw("LOWER(statut) IN ('terminé', 'termine')")
            ->whereDate('dt_fn_reel', '>=', $from)
            ->count();

        return response()->json([
            'en_cours' => $enCours,
            'termines' => $termines,
        ]);
    }

    public function beneficiaires(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);

        $parProjets = (int) DB::table('projects')
            ->whereDate('dt_debut', '>=', $from)
            ->sum(DB::raw($this->projectParticipantsExpression()));

        $parActivites = (int) DB::table('frequentations')
            ->join('activites', 'frequentations.activite_id', '=', 'activites.id')
            ->whereNotNull('frequentations.activite_id')
            ->whereDate('frequentations.date', '>=', $from)
            ->sum(DB::raw($this->activiteParticipantsExpression()));

        return response()->json([
            'total' => $parProjets + $parActivites,
            'par_projets' => $parProjets,
            'par_activites' => $parActivites,
        ]);
    }

    public function formations(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);

        $nombreFormations = DB::table('frequentations')
            ->join('activites', 'frequentations.activite_id', '=', 'activites.id')
            ->whereDate('frequentations.date', '>=', $from)
            ->whereRaw("LOWER(frequentations.type_activite) = 'formation'")
            ->distinct()
            ->count('activites.nom');

        $dureeTotaleMinutes = (int) DB::table('frequentations')
            ->whereDate('date', '>=', $from)
            ->whereRaw("LOWER(type_activite) = 'formation'")
            ->sum(DB::raw('TIMESTAMPDIFF(MINUTE, heur_debut, heur_fin)'));

        return response()->json([
            'nombre_formations' => $nombreFormations,
            'duree_totale_minutes' => max(0, $dureeTotaleMinutes),
        ]);
    }

    public function beneficiairesMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $groupBy = $request->query('groupBy');
        $mois = $request->query('mois');

        if (!$groupBy) {
            $projectRows = DB::table('projects')
                ->selectRaw("DATE_FORMAT(dt_debut, '%Y-%m') as mois")
                ->selectRaw('SUM(' . $this->projectParticipantsExpression() . ') as total')
                ->whereDate('dt_debut', '>=', $from)
                ->groupBy('mois')
                ->get();

            $activiteRows = DB::table('frequentations')
                ->join('activites', 'frequentations.activite_id', '=', 'activites.id')
                ->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
                ->selectRaw('SUM(' . $this->activiteParticipantsExpression() . ') as total')
                ->whereDate('frequentations.date', '>=', $from)
                ->whereNotNull('frequentations.activite_id')
                ->groupBy('mois')
                ->get();

            $totaux = [];
            foreach ($projectRows as $row) {
                $totaux[$row->mois] = (int) ($totaux[$row->mois] ?? 0) + (int) $row->total;
            }
            foreach ($activiteRows as $row) {
                $totaux[$row->mois] = (int) ($totaux[$row->mois] ?? 0) + (int) $row->total;
            }

            ksort($totaux);

            return response()->json(array_map(
                fn($month) => ['mois' => $month, 'total' => $totaux[$month]],
                array_keys($totaux)
            ));
        }

        if ($groupBy === 'pole') {
            $projectQuery = DB::table('projects')
                ->selectRaw("COALESCE(pole, 'Non défini') as categorie")
                ->selectRaw('SUM(' . $this->projectParticipantsExpression() . ') as total')
                ->whereDate('dt_debut', '>=', $from);
            if ($mois) {
                $projectQuery->whereRaw("DATE_FORMAT(dt_debut, '%Y-%m') = ?", [$mois]);
            }
            $projectRows = $projectQuery->groupBy('categorie')->get();

            $activiteQuery = DB::table('frequentations')
                ->join('activites', 'frequentations.activite_id', '=', 'activites.id')
                ->selectRaw("COALESCE(activites.pole, 'Non défini') as categorie")
                ->selectRaw('SUM(' . $this->activiteParticipantsExpression() . ') as total')
                ->whereDate('frequentations.date', '>=', $from)
                ->whereNotNull('frequentations.activite_id');
            if ($mois) {
                $activiteQuery->whereRaw("DATE_FORMAT(frequentations.date, '%Y-%m') = ?", [$mois]);
            }
            $activiteRows = $activiteQuery->groupBy('categorie')->get();

            $totaux = [];
            foreach ([$projectRows, $activiteRows] as $rows) {
                foreach ($rows as $row) {
                    $totaux[$row->categorie] = ($totaux[$row->categorie] ?? 0) + (int) $row->total;
                }
            }

            arsort($totaux);
            return response()->json(array_map(
                fn($cat) => ['categorie' => $cat, 'total' => $totaux[$cat]],
                array_keys($totaux)
            ));
        }

        $query = DB::table('frequentations')
            ->selectRaw("COALESCE(type_activite, 'Non défini') as categorie")
            ->selectRaw('SUM(COALESCE(nb_participants, 0)) as total')
            ->whereDate('date', '>=', $from);

        if ($mois) {
            $query->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$mois]);
        }

        $rows = $query->groupBy('categorie')->orderByDesc('total')->get();

        return response()->json($rows);
    }

    public function projetsStatuts(Request $request): JsonResponse
    {
        $months = max(1, min(12, (int) $request->query('mois', 1)));
        $includeParticipants = filter_var($request->query('includeParticipants', false), FILTER_VALIDATE_BOOLEAN);

        $start = now()->startOfMonth()->subMonths($months - 1)->toDateString();

        $query = DB::table('projects')
            ->selectRaw("DATE_FORMAT(dt_debut, '%Y-%m') as mois")
            ->selectRaw("COALESCE(statut, 'Non défini') as statut")
            ->whereDate('dt_debut', '>=', $start);

        if ($includeParticipants) {
            $query->selectRaw('SUM(' . $this->projectParticipantsExpression() . ') as valeur');
        } else {
            $query->selectRaw('COUNT(*) as valeur');
        }

        $rows = $query->groupBy('mois', 'statut')->orderBy('mois')->get();

        return response()->json($rows);
    }

    public function seances(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $typeActivite = $request->query('type_activite');

        $query = DB::table('occupations')
            ->join('frequentations', 'occupations.frequentation_id', '=', 'frequentations.id')
            ->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
            ->selectRaw('COUNT(occupations.id) as nb_seances')
            ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, occupations.heur_debut, occupations.heur_fin)) as duree_minutes')
            ->selectRaw('SUM(COALESCE(JSON_LENGTH(occupations.participants), 0)) as nb_participants')
            ->whereDate('frequentations.date', '>=', $from)
            ->groupBy('mois')
            ->orderBy('mois');

        if ($typeActivite) {
            $query->where('frequentations.type_activite', $typeActivite);
        }

        return response()->json($query->get());
    }

    public function frequentationsMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);

        $rows = DB::table('frequentations')
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as mois")
            ->selectRaw("COALESCE(type_activite, 'Non défini') as type_activite")
            ->selectRaw('COUNT(*) as total')
            ->whereDate('date', '>=', $from)
            ->groupBy('mois', 'type_activite')
            ->orderBy('mois')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            if (!isset($result[$row->mois])) {
                $result[$row->mois] = ['mois' => $row->mois];
            }
            $result[$row->mois][$row->type_activite] = (int) $row->total;
        }

        return response()->json(array_values($result));
    }

    public function occupationsMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);

        $rows = DB::table('occupations')
            ->join('frequentations', 'occupations.frequentation_id', '=', 'frequentations.id')
            ->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
            ->selectRaw('COUNT(occupations.id) as count')
            ->whereDate('frequentations.date', '>=', $from)
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return response()->json($rows);
    }

    public function outillagesMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $machine = $request->query('machine');

        $query = DB::table('occupations')
            ->join('frequentations', 'occupations.frequentation_id', '=', 'frequentations.id')
            ->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
            ->selectRaw("COALESCE(occupations.outillage_machine, 'Non défini') as machine")
            ->selectRaw('COUNT(occupations.id) as nb_utilisations')
            ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, occupations.heur_debut, occupations.heur_fin)) as duree_minutes')
            ->selectRaw('SUM(COALESCE(JSON_LENGTH(occupations.participants), 0)) as nb_utilisateurs')
            ->whereDate('frequentations.date', '>=', $from)
            ->groupBy('mois', 'machine')
            ->orderBy('mois');

        if ($machine) {
            $query->where('occupations.outillage_machine', $machine);
        }

        return response()->json($query->get());
    }
}
