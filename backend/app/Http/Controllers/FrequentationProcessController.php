<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use App\Models\Frequentation;
use App\Models\Occupation;
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
                    'project_id'    => $request->project_id, // sera null si --autre--
                    'activite_id'   => $activiteId,          // sera null si projet
                    'etape'         => $request->etape,
                    'intervenant'   => $request->intervenant,
                    'role'          => $request->role,
                    'date'          => $request->date
                ]);

                /* création occupation liée (si envoyée ou si des infos temporelles sont là) */
                if ($request->has('occupation') || $request->has('heur_debut')) {
                    $occupation = Occupation::create([
                        'frequentation_id'  => $frequentation->id,
                        'zone_occupee'      => $request->occupation['zone_occupee'] ?? null,
                        'outillage_machine' => $request->occupation['outillage_machine'] ?? null,
                        'heur_debut'        => $request->heur_debut ?? null,
                        'heur_fin'          => $request->heur_fin ?? null,
                        'participants'      => $request->participants ?? [],
                    ]);
                }

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
        $frequentations = Frequentation::with(['activite', 'occupations'])->get();
        
        $flat = $frequentations->flatMap(function ($f) {
            if ($f->occupations->isEmpty()) {
                return [[
                    'id'                => $f->id,
                    'date'              => $f->date,
                    'type_activite'     => $f->type_activite,
                    'etape'             => $f->etape,
                    'intervenant'       => $f->intervenant,
                    'role'              => $f->role,
                    'activite_nom'      => $f->activite?->nom ?? $f->project?->intitule_projet,
                    'activite_pole'     => $f->activite?->pole ?? $f->project?->pole,
                    'activite_filiere'  => $f->activite?->filiere ?? $f->project?->filiere,
                    'activite_groupe'   => $f->activite?->groupe ?? $f->project?->groupe,
                    'activite_id'       => $f->activite_id,
                    'projet_id'         => $f->project_id,
                    'occupation_id'     => null,
                    'zone_occupee'      => null,
                    'outillage_machine' => null,
                    'heur_debut'        => null,
                    'heur_fin'          => null,
                    'participants'      => [],
                ]];
            }
            
            return $f->occupations->map(function ($occ) use ($f) {
                return [
                    'id'                => $occ->id, // Use Occupation ID for unique keys in frontend
                    'occupation_id'     => $occ->id,
                    'frequentation_id'  => $f->id,
                    'date'              => $f->date,
                    'type_activite'     => $f->type_activite,
                    'etape'             => $f->etape,
                    'intervenant'       => $f->intervenant,
                    'role'              => $f->role,
                    'activite_nom'      => $f->activite?->nom ?? $f->project?->intitule_projet,
                    'activite_pole'     => $f->activite?->pole ?? $f->project?->pole,
                    'activite_filiere'  => $f->activite?->filiere ?? $f->project?->filiere,
                    'activite_groupe'   => $f->activite?->groupe ?? $f->project?->groupe,
                    'zone_occupee'      => $occ->zone_occupee,
                    'outillage_machine' => $occ->outillage_machine,
                    'heur_debut'        => $occ->heur_debut,
                    'heur_fin'          => $occ->heur_fin,
                    'participants'      => $occ->participants ?? [],
                    'activite_id'       => $f->activite_id,
                    'projet_id'         => $f->project_id,
                ];
            });
        });

        return response()->json($flat->values());
    }

    public function updateFrequentation(Request $request, $id)
    {
        try {
            DB::transaction(function () use ($request, $id) {
                // Find frequentation either directly or via occupation id
                $occupation = Occupation::find($id);
                $frequentation = $occupation ? $occupation->frequentation : Frequentation::findOrFail($id);

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
                ]);

                // Mettre à jour occupation si elle existe pour l'interface Frequentation.jsx (qui édite la première)
                if ($request->has('occupation') || $request->has('heur_debut')) {
                    $occ = $frequentation->occupations()->first();
                    if ($occ) {
                        $occ->update([
                            'zone_occupee'      => $request->occupation['zone_occupee'] ?? $occ->zone_occupee,
                            'outillage_machine' => $request->occupation['outillage_machine'] ?? $occ->outillage_machine,
                            'heur_debut'        => $request->heur_debut ?? $occ->heur_debut,
                            'heur_fin'          => $request->heur_fin ?? $occ->heur_fin,
                            'participants'      => $request->participants ?? $occ->participants,
                        ]);
                    } else {
                        Occupation::create([
                            'frequentation_id'  => $frequentation->id,
                            'zone_occupee'      => $request->occupation['zone_occupee'] ?? null,
                            'outillage_machine' => $request->occupation['outillage_machine'] ?? null,
                            'heur_debut'        => $request->heur_debut ?? null,
                            'heur_fin'          => $request->heur_fin ?? null,
                            'participants'      => $request->participants ?? [],
                        ]);
                    }
                }
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
                $occupation = Occupation::find($id);
                $frequentation = $occupation ? $occupation->frequentation : Frequentation::findOrFail($id);

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