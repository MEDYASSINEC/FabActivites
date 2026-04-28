<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use App\Models\Frequentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FrequentationProcessController extends Controller
{
    private function syncParticipants($model, array $participantNames)
    {
        $participantIds = [];
        foreach ($participantNames as $name) {
            $name = trim($name);
            if (empty($name)) continue;

            $participant = \App\Models\Participant::firstOrCreate(['nom' => $name]);
            $participantIds[] = $participant->id;
        }
        $model->participants()->sync($participantIds);
    }

    /**
     * Formate une fréquentation avec ses relations pour le frontend.
     */
    private function formatFrequentation(Frequentation $f)
    {
        // On s'assure que les relations sont chargées
        $f->loadMissing(['activite', 'project', 'occupations', 'participants', 'project.participants']);

        $frequentationParticipants = $f->participants->pluck('nom')->toArray();
        $projectParticipantsCount = $f->project ? $f->project->participants->count() : 0;

        return [
            'id'                   => $f->id,
            'date'                 => $f->date,
            'type_activite'        => $f->type_activite,
            'etape'                => $f->etape,
            'intervenant'          => $f->intervenant,
            'role'                 => $f->role,
            'activite_nom'         => $f->activite?->nom ?? $f->project?->intitule_projet,
            'activite_pole'        => $f->activite?->pole ?? $f->project?->pole,
            'activite_filiere'     => $f->activite?->filiere ?? $f->project?->filiere,
            'activite_groupe'      => $f->activite?->groupe ?? $f->project?->groupe,
            'activite_id'          => $f->activite_id,
            'project_id'           => $f->project_id, // Uniformisé avec le front
            'heur_debut'           => $f->heur_debut,
            'heur_fin'             => $f->heur_fin,
            'participants'         => $frequentationParticipants,
            'project'              => $f->project ? array_merge($f->project->toArray(), ['participants' => $f->project->participants->pluck('nom')->toArray()]) : null,
            'nb_participants'      => count($frequentationParticipants) ?: $projectParticipantsCount,
        ];
    }

    public function index()
    {
        $frequentations = Frequentation::with(['activite', 'project', 'occupations'])->get();
        $data = $frequentations->map(fn($f) => $this->formatFrequentation($f));
        return response()->json($data);
    }

    public function createFrequentation(Request $request)
    {
        try {
            $frequentation = DB::transaction(function () use ($request) {
                $activiteId = null;

                if (!$request->project_id && $request->has('activite')) {
                    $activite = Activite::create([
                        'nom'     => $request->activite['nom'] ?? null,
                        'pole'    => $request->activite['pole'] ?? null,
                        'filiere' => $request->activite['filiere'] ?? null,
                        'groupe'  => $request->activite['groupe'] ?? null
                    ]);
                    $activiteId = $activite->id;
                }

                $f = Frequentation::create([
                    'type_activite' => $request->type_activite,
                    'project_id'    => $request->project_id,
                    'activite_id'   => $activiteId,
                    'etape'         => $request->etape,
                    'intervenant'   => $request->intervenant,
                    'role'          => $request->role,
                    'heur_debut'    => $request->heur_debut,
                    'heur_fin'      => $request->heur_fin,
                    'date'          => $request->date,
                ]);

                if ($request->has('participants') && is_array($request->participants)) {
                    $this->syncParticipants($f, $request->participants);
                }

                return $f;
            });

            return response()->json([
                'message' => 'Fréquentation créée avec succès.',
                'data'    => $this->formatFrequentation($frequentation)
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function updateFrequentation(Request $request, $id)
    {
        try {
            $frequentation = DB::transaction(function () use ($request, $id) {
                $f = Frequentation::findOrFail($id);

                if ($f->activite && $request->has('activite')) {
                    $f->activite->update([
                        'nom'     => $request->activite['nom'] ?? $f->activite->nom,
                        'pole'    => $request->activite['pole'] ?? $f->activite->pole,
                        'filiere' => $request->activite['filiere'] ?? $f->activite->filiere,
                        'groupe'  => $request->activite['groupe'] ?? $f->activite->groupe
                    ]);
                }

                $f->update([
                    'type_activite' => $request->type_activite,
                    'project_id'    => $request->project_id,
                    'date'          => $request->date,
                    'etape'         => $request->etape,
                    'intervenant'   => $request->intervenant,
                    'role'          => $request->role,
                    'heur_debut'    => $request->heur_debut,
                    'heur_fin'      => $request->heur_fin,
                ]);

                if ($request->has('participants') && is_array($request->participants)) {
                    $this->syncParticipants($f, $request->participants);
                }

                return $f;
            });

            return response()->json([
                'message' => 'Fréquentation mise à jour.',
                'data'    => $this->formatFrequentation($frequentation)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function deleteFrequentation($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $frequentation = Frequentation::findOrFail($id);
                if ($frequentation->activite) {
                    $frequentation->activite->delete();
                }
                $frequentation->delete();
            });

            return response()->json(['message' => 'Fréquentation supprimée.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
