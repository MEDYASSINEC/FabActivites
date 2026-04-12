<?php
namespace App\Http\Controllers;

use App\Imports\ProjectsImport;
use App\Imports\FrequentationsImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

class ExcelImportController extends Controller
{
    public function importProjects(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
        ]);

        // Increase limits for large files
        ini_set('memory_limit', '1024M');
        set_time_limit(300);

        try {
            Excel::import(new ProjectsImport, $request->file('file'));
            return response()->json(['message' => 'Import des projets réussi !'], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Projet Import Error: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l’import des projets.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function importFrequentations(Request $request)
    {
        \Illuminate\Support\Facades\Log::info("DEBUG: importFrequentations reached");
        
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
        ]);

        // Increase limits for large files
        ini_set('memory_limit', '1024M');
        set_time_limit(300);

        try {
            DB::beginTransaction();
            Excel::import(new FrequentationsImport, $request->file('file'));
            DB::commit();
            return response()->json(['message' => 'Import des fréquentations réussi !'], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            \Illuminate\Support\Facades\Log::error("Frequentation Import Error: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l’import des fréquentations.',
                'error'   => $e->getMessage(),
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }
}
