<?php

namespace App\Http\Controllers;

use App\Models\Occupation;
use Illuminate\Http\Request;

class OccupationController extends Controller
{
    public function index()
    {
        try {
            return response()->json(Occupation::all());
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
                'outillage_machine' => 'required|string'
            ]);
            $occupation = Occupation::create($validated);
            return response()->json([
                'message'    => 'Occupation créée avec succès.',
                'occupation' => $occupation
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
            $occupation = Occupation::findOrFail($id);
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
            $occupation->update($request->validate([
                'zone_occupee'      => 'sometimes|string',
                'outillage_machine' => 'sometimes|string'
            ]));
            return response()->json([
                'message'    => 'Occupation mise à jour avec succès.',
                'occupation' => $occupation
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
