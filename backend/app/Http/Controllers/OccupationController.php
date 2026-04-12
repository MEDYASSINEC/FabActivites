<?php

namespace App\Http\Controllers;

use App\Models\Occupation;
use Illuminate\Http\Request;

class OccupationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Occupation::with(['frequentation']);
            
            if ($request->has('date') && $request->date) {
                $date = $request->date;
                $query->whereHas('frequentation', function($q) use ($date) {
                    $q->where('date', $date);
                });
            }
            
            $occupations = $query->get();
            return response()->json($occupations);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des occupations.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'zone_occupee'      => 'required|string',
                'outillage_machine' => 'required|string',
                'heur_debut'        => 'required',
                'heur_fin'          => 'nullable',
                'frequentation_id'  => 'required|integer|exists:frequentations,id',
                'participants'      => 'nullable|array',
            ]);

            $occupation = Occupation::create([
                'zone_occupee'      => $validated['zone_occupee'],
                'outillage_machine' => $validated['outillage_machine'],
                'heur_debut'        => $validated['heur_debut'],
                'heur_fin'          => $validated['heur_fin'],
                'frequentation_id'  => $validated['frequentation_id'],
                'participants'      => $validated['participants'] ?? [],
            ]);

            return response()->json([
                'message'    => 'Occupation créée avec succès.',
                'occupation' => $occupation->load(['frequentation'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'occupation.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $occupation = Occupation::with(['frequentation'])->findOrFail($id);
            return response()->json($occupation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Occupation introuvable.',
                'error'   => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $occupation = Occupation::findOrFail($id);
            $validated = $request->validate([
                'zone_occupee'      => 'sometimes|string',
                'outillage_machine' => 'sometimes|string',
                'heur_debut'        => 'sometimes',
                'heur_fin'          => 'sometimes',
                'frequentation_id'  => 'sometimes|integer|exists:frequentations,id',
                'participants'      => 'nullable|array',
            ]);

            $occupation->update($validated);

            return response()->json([
                'message'    => 'Occupation mise à jour avec succès.',
                'occupation' => $occupation->load(['frequentation'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'occupation.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Occupation::findOrFail($id)->delete();
            return response()->json([
                'message' => 'Occupation supprimée avec succès.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'occupation.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
