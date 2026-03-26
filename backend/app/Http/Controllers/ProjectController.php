<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = Project::all();

        return response()->json($projects);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'source_du_projet' => 'required|string',
                'intitule_projet'=> 'required|string',
                'statut'=> 'required|string',
                'etape'=> 'required|string',
                'responsable_projet'=> 'required|string',
                'pole'=> 'required|string',
                'filiere'=> 'required|string',
                'groupe'=> 'required|string',
                'participants'=> 'required|array',
                'dt_debut'=> 'required|date',
                'dt_fn_prevu' => 'nullable|date',
                'dt_suspension' => 'nullable|date',
                'dt_abandon' => 'nullable|date',
                'dt_fn_reel' => 'nullable|date',
                'remarques' => 'nullable|string',
            ]);
            $project = Project::create($validated);

            return response()->json([
                'message' => 'Projet crée avec succés.',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message'=> 'Erreur lors de création du projet',
                'error' => $e->getMessage()
            ],500);
        }
    }
    
    /**
     * Display the specified resource.
    */
    public function show($id)
    {
        try {
            $project = Project::findOrFail($id);

            return response()->json($project);
        } catch (\Exception $e) {
            return response()->json([
                'message'=> 'Erreur lors de récupération du projet',
                'error' => $e->getMessage()
            ],500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $project = Project::findOrFail($id);

            $validated = $request->validate([
                'source_du_projet' => 'sometimes|string',
                'intitule_projet'=> 'sometimes|string',
                'statut'=> 'sometimes|string',
                'etape'=> 'sometimes|string',
                'responsable_projet'=> 'sometimes|string',
                'pole'=> 'sometimes|string',
                'filiere'=> 'sometimes|string',
                'groupe'=> 'sometimes|string',
                'participants'=> 'sometimes|array',
                'dt_debut'=> 'sometimes|date',
                'dt_fn_prevu' => 'sometimes|nullable|date',
                'dt_suspension' => 'sometimes|nullable|date',
                'dt_abandon' => 'sometimes|nullable|date',
                'dt_fn_reel' => 'sometimes|nullable|date',
                'remarques' => 'sometimes|nullable|string',
            ]);

            $project->update($validated);

            return response()->json([
                'message'=> 'Projet mis à jour avec succès.',
                'projet' => $project
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message'=> 'Erreur lors de modification du projet',
                'error' => $e->getMessage()
            ],500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $project = Project::findOrFail($id);
            $project->delete();

            return response()->json([
                'message' => 'Projet supprimé avec succès.',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message'=> 'Erreur lors de la suppression du projet.',
                'error' => $e->getMessage()
            ],500);
        }
    }
}
