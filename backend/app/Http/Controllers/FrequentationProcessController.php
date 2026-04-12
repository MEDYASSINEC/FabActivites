<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use App\Models\Frequentation;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;

class FrequentationProcessController extends Controller
{
    public function createFrequentation(Request $request)
    {
        try {
            $result = DB::transaction(function () use ($request) {
                $activiteId = null;

                /* création activité (seulement si pas de projet sélectionné) */
                if (!$request->project_id && $request->has('activite')) {
                    $activite = Activite::create([
                        'nom'     => $request->activite['nom'] ?? null,
                        'pole'    => $request->activite['pole'] ?? null,
                        'filiere' => $request->activite['filiere'] ?? null,
                        'groupe'  => $request->activite['groupe'] ?? null
                    ]);
                    $activiteId = $activite->id;
                }

                /* création fréquentation */
                $frequentation = Frequentation::create([
                    'type_activite' => $request->type_activite,
                    'project_id'    => $request->project_id,
                    'activite_id'   => $activiteId,
                    'etape'         => $request->etape,
                    'intervenant'   => $request->intervenant,
                    'role'          => $request->role,
                    'heur_debut'    => $request->heur_debut,
                    'heur_fin'      => $request->heur_fin,
                    'date'          => $request->date
                ]);

                return $frequentation;
            });

            return response()->json([
                'message' => 'Fréquentation créée avec succès.',
                'data'    => $result
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la fréquentation.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $frequentations = Frequentation::with(['activite', 'project', 'occupations'])->get();
        
        $data = $frequentations->map(function ($f) {
            // Calculer le nombre total de participants uniques sur toutes les occupations de cette séance
            $allParticipants = $f->occupations->flatMap(function ($occ) {
                return $occ->participants ?? [];
            })
            ->map(fn($p) => trim(mb_strtolower($p))) // On normalise pour éviter les doublons dus aux espaces ou à la casse
            ->filter() // On retire les entrées vides
            ->unique();

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
                'projet_id'            => $f->project_id,
                'heur_debut'           => $f->heur_debut,
                'heur_fin'             => $f->heur_fin,
                'nb_participants'      => $allParticipants->count(),
            ];
        });

        return response()->json($data);
    }

    public function updateFrequentation(Request $request, $id)
    {
        try {
            DB::transaction(function () use ($request, $id) {
                $frequentation = Frequentation::findOrFail($id);

                // mettre à jour activité
                if ($frequentation->activite && $request->has('activite')) {
                    $frequentation->activite->update([
                        'nom'     => $request->activite['nom'] ?? $frequentation->activite->nom,
                        'pole'    => $request->activite['pole'] ?? $frequentation->activite->pole,
                        'filiere' => $request->activite['filiere'] ?? $frequentation->activite->filiere,
                        'groupe'  => $request->activite['groupe'] ?? $frequentation->activite->groupe
                    ]);
                }

                // Mettre à jour fréquentation
                $frequentation->update([
                    'type_activite' => $request->type_activite,
                    'project_id'    => $request->project_id,
                    'date'          => $request->date,
                    'etape'         => $request->etape,
                    'intervenant'   => $request->intervenant,
                    'role'          => $request->role,
                    'heur_debut'    => $request->heur_debut,
                    'heur_fin'      => $request->heur_fin,
                ]);
            });

            return response()->json(['message' => 'Fréquentation mise à jour.']);
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

                // Les occupations sont supprimées en cascade grâce à la clé étrangère on delete cascade.
                // Donc il suffit de supprimer l'activité si elle est orpheline.
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
