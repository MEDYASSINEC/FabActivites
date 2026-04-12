<?php

namespace App\Http\Controllers;

use App\Models\Frequentation;
use Illuminate\Http\Request;

class FrequentationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Frequentation::with([
                'project',
                'activite',
                'occupations'
            ]);

            if ($request->has('date') && $request->date) {
                $query->where('date', $request->date);
            }

            return response()->json($query->get());
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des fréquentations.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $frequentation = Frequentation::with([
                'project',
                'activite',
                'occupations'
            ])->findOrFail($id);
            return response()->json($frequentation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Fréquentation introuvable.',
                'error'   => $e->getMessage()
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            Frequentation::findOrFail($id)->delete();
            return response()->json([
                'message' => 'Fréquentation supprimée avec succès.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la fréquentation.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}