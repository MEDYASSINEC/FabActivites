<?php

namespace App\Http\Controllers;

use App\Support\FormationYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    private function fromDate(Request $request): string
    {
        return $request->query('from', FormationYear::getFormationYearStart()->toDateString());
    }

    private function frequentationParticipantsExpression(): string
    {
        return "(SELECT COUNT(*) FROM frequentation_participant WHERE frequentation_participant.frequentation_id = frequentations.id)";
    }

    /**
     * Endpoint optimisé pour récupérer tous les KPIs en une seule fois.
     */
    public function summary(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "dashboard_summary_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            // 1. Projets
            $projetsCount = DB::table('projects')->whereDate('dt_debut', '>=', $from)->count();

            // 1.2 Projets encours
            $projetsEnCours = DB::table('projects')->whereDate('dt_debut', '>=', $from)->where('statut', 'En cours')->count();

            // 2. Bénéficiaires (uniques depuis fréquentations)
            $benefTotal = (int) DB::table('frequentations')
                ->join('frequentation_participant', 'frequentations.id', '=', 'frequentation_participant.frequentation_id')
                ->whereDate('frequentations.date', '>=', $from)
                ->count(DB::raw('DISTINCT participant_id'));

            $benefLastMonth = (int) DB::table('frequentations')
                ->join('frequentation_participant', 'frequentations.id', '=', 'frequentation_participant.frequentation_id')
                ->whereDate('frequentations.date', '>=', date('Y-m-01'))
                ->count(DB::raw('DISTINCT participant_id'));

            // 3. Formations
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

            // 4. frequentations
            $frequentations = DB::table('frequentations')->whereDate('date', '>=', $from)->count();

            $frequentationLastMonth = DB::table('frequentations')->whereDate('date', '>=', date('Y-m-01'))->count();

            // 5. Occupations
            $occupationsMinutes = DB::table('occupations')->whereDate('date', '>=', $from)->sum(DB::raw('TIMESTAMPDIFF(MINUTE, heur_debut, heur_fin)'));
            $occupations = $occupationsMinutes / 60;

            $occupationLastMonthMinutes = DB::table('occupations')->whereDate('date', '>=', date('Y-m-01'))->sum(DB::raw('TIMESTAMPDIFF(MINUTE, heur_debut, heur_fin)'));
            $occupationLastMonth = $occupationLastMonthMinutes / 60;
            return response()->json([
                'projets' => $projetsCount,
                'projets_encours' => $projetsEnCours,
                'beneficiaires' => [
                    'total' => $benefTotal,
                    'last_month' => $benefLastMonth
                ],
                'formations' => [
                    'nombre' => $nombreFormations,
                    'duree_minutes' => max(0, $dureeTotaleMinutes),
                ],
                'frequentations' => [
                    'total' => $frequentations,
                    'last_month' => $frequentationLastMonth,
                ],
                'occupations' => [
                    'total' => $occupations,
                    'last_month' => $occupationLastMonth,
                ]
            ]);
        });
    }

    public function projetsStatutsAnnee(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "projets_statuts_annee_v2_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            $enCours = DB::table('projects')
                ->whereDate('dt_debut', '>=', $from)
                ->whereRaw("LOWER(statut) = 'en cours'")
                ->count();

            $termines = DB::table('projects')
                ->whereRaw("LOWER(statut) IN ('terminé', 'termine')")
                ->whereDate('dt_fn_reel', '>=', $from)
                ->count();

            return response()->json([
                'en_cours' => $enCours,
                'termines' => $termines,
            ]);
        });
    }

    public function beneficiaires(Request $request): JsonResponse
    {
        // Redirige vers summary si possible côté front pour gagner du temps
        $from = $this->fromDate($request);
        $cacheKey = "beneficiaires_stats_v2_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            $totalUnique = (int) DB::table('frequentations')
                ->join('frequentation_participant', 'frequentations.id', '=', 'frequentation_participant.frequentation_id')
                ->whereDate('frequentations.date', '>=', $from)
                ->count(DB::raw('DISTINCT participant_id'));

            $parProjets = (int) DB::table('frequentations')
                ->join('frequentation_participant', 'frequentations.id', '=', 'frequentation_participant.frequentation_id')
                ->whereDate('frequentations.date', '>=', $from)
                ->whereNotNull('project_id')
                ->count(DB::raw('DISTINCT participant_id'));

            $parActivites = (int) DB::table('frequentations')
                ->join('frequentation_participant', 'frequentations.id', '=', 'frequentation_participant.frequentation_id')
                ->whereDate('frequentations.date', '>=', $from)
                ->whereNotNull('activite_id')
                ->count(DB::raw('DISTINCT participant_id'));

            return response()->json([
                'total' => $totalUnique,
                'par_projets' => $parProjets,
                'par_activites' => $parActivites,
            ]);
        });
    }

    public function formations(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "formations_stats_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
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
        });
    }

    public function beneficiairesMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $groupBy = $request->query('groupBy');
        $mois = $request->query('mois');

        $cacheKey = "beneficiaires_mois_v3_" . md5($from . $groupBy . (is_array($mois) ? implode(',', $mois) : $mois));

        return Cache::remember($cacheKey, 600, function () use ($from, $groupBy, $mois) {
            $query = DB::table('frequentations')
                ->join('frequentation_participant', 'frequentations.id', '=', 'frequentation_participant.frequentation_id')
                ->whereDate('frequentations.date', '>=', $from);

            if ($mois) {
                $monthsArray = is_array($mois) ? $mois : [$mois];
                $placeholders = implode(',', array_fill(0, count($monthsArray), '?'));
                $query->whereRaw("DATE_FORMAT(frequentations.date, '%Y-%m') IN ($placeholders)", $monthsArray);
            }

            if (!$groupBy) {
                // Par mois
                $rows = $query->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
                    ->selectRaw("COUNT(DISTINCT frequentation_participant.participant_id) as total")
                    ->groupBy('mois')
                    ->orderBy('mois')
                    ->get();
                return response()->json($rows);
            }

            if ($groupBy === 'pole') {
                // Par pôle (projet ou activité)
                $rows = $query->leftJoin('projects', 'frequentations.project_id', '=', 'projects.id')
                    ->leftJoin('activites', 'frequentations.activite_id', '=', 'activites.id')
                    ->selectRaw("COALESCE(projects.pole, activites.pole, 'Non défini') as categorie")
                    ->selectRaw("COUNT(DISTINCT frequentation_participant.participant_id) as total")
                    ->groupBy('categorie')
                    ->orderByDesc('total')
                    ->get();
                return response()->json($rows);
            }

            // Par type (default)
            $rows = $query->selectRaw("COALESCE(type_activite, 'Non défini') as categorie")
                ->selectRaw("COUNT(DISTINCT frequentation_participant.participant_id) as total")
                ->groupBy('categorie')
                ->orderByDesc('total')
                ->get();
            return response()->json($rows);
        });
    }

    public function projetsStatuts(Request $request): JsonResponse
    {
        $months = max(1, min(12, (int) $request->query('mois', 1)));
        $includeParticipants = filter_var($request->query('includeParticipants', false), FILTER_VALIDATE_BOOLEAN);
        $cacheKey = "projets_statuts_graph_v2_" . md5($months . $includeParticipants);

        return Cache::remember($cacheKey, 600, function () use ($months, $includeParticipants) {
            $start = now()->startOfMonth()->subMonths($months - 1)->toDateString();

            // On utilise CASE pour sélectionner la date de référence selon le statut
            $dateExpression = "CASE 
                WHEN statut = 'Suspendu' THEN dt_suspension
                WHEN statut = 'Abandonné' THEN dt_abandon
                WHEN statut = 'Terminé' THEN dt_fn_reel
                ELSE dt_debut
            END";

            $query = DB::table('projects')
                ->selectRaw("DATE_FORMAT($dateExpression, '%Y-%m') as mois")
                ->selectRaw("COALESCE(statut, 'Non défini') as statut")
                ->whereNotNull(DB::raw($dateExpression))
                ->whereDate(DB::raw($dateExpression), '>=', $start);

            if ($includeParticipants) {
                $query->selectRaw('SUM((SELECT COUNT(*) FROM participant_project WHERE participant_project.project_id = projects.id)) as valeur');
            } else {
                $query->selectRaw('COUNT(*) as valeur');
            }

            return response()->json($query->groupBy('mois', 'statut')->orderBy('mois')->get());
        });
    }

    public function seances(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "seances_stats_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            $rawFormations = DB::table('frequentations')
                ->leftJoin('activites', 'frequentations.activite_id', '=', 'activites.id')
                ->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
                ->selectRaw('COALESCE(activites.nom, "Sans nom") as formation_nom')
                ->selectRaw('COUNT(*) as nb_seances_formation')
                ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, frequentations.heur_debut, frequentations.heur_fin)) as duree_minutes_formation')
                ->selectRaw('MAX(' . $this->frequentationParticipantsExpression() . ') as nb_participants_formation')
                ->whereRaw('LOWER(frequentations.type_activite) LIKE ?', ['%formation%'])
                ->whereDate('frequentations.date', '>=', $from)
                ->groupBy('mois', 'formation_nom')
                ->get();

            $results = $rawFormations->groupBy('mois')->map(function ($items, $mois) {
                return [
                    'mois' => $mois,
                    'nb_formations' => $items->count(),
                    'nb_seances' => $items->sum('nb_seances_formation'),
                    'duree_minutes' => $items->sum('duree_minutes_formation'),
                    'nb_participants' => $items->sum('nb_participants_formation'),
                ];
            })->values()->sortBy('mois');

            return response()->json($results->values());
        });
    }

    public function frequentationsMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $groupBy = $request->query('groupBy');
        $cacheKey = "frequentations_mois_" . md5($from . $groupBy);

        return Cache::remember($cacheKey, 600, function () use ($from, $groupBy) {
            $query = DB::table('frequentations')
                ->selectRaw("DATE_FORMAT(frequentations.date, '%Y-%m') as mois")
                ->selectRaw('COUNT(*) as total')
                ->whereDate('frequentations.date', '>=', $from);

            if ($groupBy === 'pole') {
                $query->leftJoin('activites', 'frequentations.activite_id', '=', 'activites.id')
                    ->selectRaw("COALESCE(activites.pole, 'Non défini') as categorie")
                    ->groupBy('mois', 'categorie');
            } else {
                $query->selectRaw("COALESCE(type_activite, 'Non défini') as categorie")
                    ->groupBy('mois', 'categorie');
            }

            $rows = $query->orderBy('mois')->get();

            $result = [];
            foreach ($rows as $row) {
                if (!isset($result[$row->mois])) {
                    $result[$row->mois] = ['mois' => $row->mois];
                }
                $result[$row->mois][$row->categorie] = (int) $row->total;
            }

            return response()->json(array_values($result));
        });
    }

    public function formationsTable(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "formations_table_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            $rows = DB::table('frequentations')
                ->leftJoin('activites', 'frequentations.activite_id', '=', 'activites.id')
                ->selectRaw('COALESCE(activites.nom, "Sans nom") as nom')
                ->selectRaw('COUNT(*) as nb_seances')
                ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, frequentations.heur_debut, frequentations.heur_fin)) as duree_minutes')
                ->selectRaw('MAX(' . $this->frequentationParticipantsExpression() . ') as max_participants')
                ->whereRaw('LOWER(frequentations.type_activite) LIKE ?', ['%formation%'])
                ->whereDate('frequentations.date', '>=', $from)
                ->groupBy('nom')
                ->orderByDesc('nb_seances')
                ->get();

            return response()->json($rows);
        });
    }

    public function occupationsZones(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "occupations_zones_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            $rows = DB::table('occupations')
                ->join('frequentations', 'occupations.frequentation_id', '=', 'frequentations.id')
                ->selectRaw("DATE_FORMAT(occupations.date, '%Y-%m') as mois")
                ->selectRaw("COALESCE(occupations.zone_occupee, 'Non défini') as zone")
                ->selectRaw('COUNT(occupations.id) as nb_utilisations')
                ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, occupations.heur_debut, occupations.heur_fin)) / 60 as heures')
                ->whereDate('occupations.date', '>=', $from)
                ->groupBy('mois', 'zone')
                ->orderBy('mois')
                ->get();

            return response()->json($rows);
        });
    }

    public function occupationsMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $cacheKey = "occupations_mois_" . md5($from);

        return Cache::remember($cacheKey, 600, function () use ($from) {
            $rows = DB::table('occupations')
                ->selectRaw("DATE_FORMAT(date, '%Y-%m') as mois")
                ->selectRaw('COUNT(id) as count')
                ->whereDate('date', '>=', $from)
                ->groupBy('mois')
                ->orderBy('mois')
                ->get();

            return response()->json($rows);
        });
    }

    public function outillagesMois(Request $request): JsonResponse
    {
        $from = $this->fromDate($request);
        $machine = $request->query('machine');
        $cacheKey = "outillages_mois_" . md5($from . $machine);

        return Cache::remember($cacheKey, 600, function () use ($from, $machine) {
            $query = DB::table('occupations')
                ->join('frequentations', 'occupations.frequentation_id', '=', 'frequentations.id')
                ->selectRaw("DATE_FORMAT(occupations.date, '%Y-%m') as mois")
                ->selectRaw("COALESCE(occupations.outillage_machine, 'Non défini') as machine")
                ->selectRaw('COUNT(occupations.id) as nb_utilisations')
                ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, occupations.heur_debut, occupations.heur_fin)) as duree_minutes')
                ->whereDate('occupations.date', '>=', $from)
                ->groupBy('mois', 'machine')
                ->orderBy('mois');

            if ($machine) {
                $query->where('occupations.outillage_machine', $machine);
            }

            return response()->json($query->get());
        });
    }
}
