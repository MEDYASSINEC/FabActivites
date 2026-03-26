<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use Illuminate\Http\Request;

class ActiviteController extends Controller
{
    public function index()
    {
        try {
            return response()->json(Activite::all());
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des activités.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string',
                'pole' => 'required|string',
                'filiere' => 'required|string',
                'groupe' => 'required|string'
            ]);
            $activite = Activite::create($validated);
            return response()->json([
                'message' => 'Activité créée avec succès.',
                'activite' => $activite
            ], 201);
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'activité.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $activite = Activite::findOrFail($id);
            return response()->json($activite);
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Activité introuvable.',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $activite = Activite::findOrFail($id);
            $activite->update($request->validate([
                'nom' => 'sometimes|string',
                'pole' => 'sometimes|string',
                'filiere' => 'sometimes|string',
                'groupe' => 'sometimes|string'
            ]));
            return response()->json([
                'message' => 'Activité mise à jour avec succès.',
                'activite' => $activite
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'activité.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Activite::findOrFail($id)->delete();
            return response()->json([
                'message' => 'Activité supprimée avec succès.'
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'activité.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
