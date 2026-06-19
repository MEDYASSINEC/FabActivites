<?php
namespace App\Http\Controllers;

use App\Imports\ProjectsImport;
use App\Imports\FrequentationsImport;
use App\Imports\OccupationsImport;
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
            DB::transaction(function () use ($request) {
                Excel::import(new ProjectsImport, $request->file('file'));
            });
            return response()->json(['message' => 'Import des projets réussi !'], 201);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Projet Import Error: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            $error = $e->getMessage();
            if (strpos($error, 'SQLSTATE') !== false || strpos($error, 'database') !== false) {
                if (strpos($error, 'responsable_projet') !== false) {
                    $error = "Le responsable de projet est manquant pour l'un des projets.";
                } else {
                    $error = "Une erreur de base de données est survenue lors de l'enregistrement des projets.";
                }
            }

            return response()->json([
                'message' => 'Erreur lors de l’import des projets.',
                'error'   => $error,
            ], 500);
        }
    }

    public function importFrequentations(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
        ]);

        // Increase limits for large files
        // PhpSpreadsheet loads ALL sheets into memory; a 5.74 MB file with 
        // 5 sheets and ~8000 rows needs ~500-800 MB just for the spreadsheet object.
        ini_set('memory_limit', '2048M');
        set_time_limit(600);

        try {
            DB::transaction(function () use ($request) {
                Excel::import(new FrequentationsImport, $request->file('file'));
            });
            return response()->json(['message' => 'Import des fréquentations réussi !'], 201);
        } catch (\Throwable $e) {
            // Clear caches in case of error to free memory
            FrequentationsImport::clearCaches();

            \Illuminate\Support\Facades\Log::error("Frequentation Import Error: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $error = $e->getMessage();
            if (strpos($error, 'SQLSTATE') !== false || strpos($error, 'database') !== false) {
                $error = "Une erreur de base de données est survenue lors de l'enregistrement des fréquentations.";
            }
            if (strpos($error, 'memory') !== false || strpos($error, 'Allowed memory') !== false) {
                $error = "Le fichier est trop volumineux pour être traité en une seule fois. Essayez de réduire le nombre de feuilles ou de lignes dans le fichier Excel.";
            }

            return response()->json([
                'message' => 'Erreur lors de l\'import des fréquentations.',
                'error'   => $error,
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function importOccupations(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
        ]);

        ini_set('memory_limit', '2048M');
        set_time_limit(600);

        try {
            $importer = new OccupationsImport();
            DB::transaction(function () use ($importer, $request) {
                Excel::import($importer, $request->file('file'));
            });

            $ignored = $importer->getIgnoredRows();

            if (count($ignored) > 0) {
                $headers = [
                    'Date',
                    'Heure Début',
                    'Heure Fin',
                    'Nom de l\'activité/projet',
                    'Type_activité',
                    'Zone occupée',
                    'Outillage / Machine utilisée',
                    'Raison du Rejet'
                ];

                $output = fopen('php://temp', 'r+');
                // UTF-8 BOM for French Excel compatibility
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($output, $headers, ';');

                foreach ($ignored as $row) {
                    fputcsv($output, [
                        $row['date'] ?? '',
                        $row['heure_debut'] ?? $row['heur_debut'] ?? '',
                        $row['heure_fin'] ?? $row['heur_fin'] ?? '',
                        $row['nom_de_lactiviteprojet'] ?? $row['nom_activite'] ?? $row['projet'] ?? '',
                        $row['type_activite'] ?? '',
                        $row['zone_occupee'] ?? '',
                        $row['outillage_machine_utilisee'] ?? $row['outillage_machine'] ?? '',
                        $row['raison_rejet'] ?? ''
                    ], ';');
                }

                rewind($output);
                $csvContent = stream_get_contents($output);
                fclose($output);

                return response($csvContent, 200, [
                    'Content-Type' => 'text/csv',
                    'Content-Disposition' => 'attachment; filename="occupations_ignorees.csv"',
                    'X-Ignored-Count' => count($ignored),
                    'Access-Control-Expose-Headers' => 'X-Ignored-Count',
                    'Access-Control-Allow-Origin' => '*'
                ]);
            }

            return response()->json([
                'message' => 'Import des occupations réussi !',
                'ignored_count' => 0
            ], 201);
        } catch (\Throwable $e) {
            OccupationsImport::clearCaches();

            \Illuminate\Support\Facades\Log::error("Occupation Import Error: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $error = $e->getMessage();
            if (strpos($error, 'SQLSTATE') !== false || strpos($error, 'database') !== false) {
                $error = "Une erreur de base de données est survenue lors de l'enregistrement des occupations.";
            }
            if (strpos($error, 'memory') !== false || strpos($error, 'Allowed memory') !== false) {
                $error = "Le fichier est trop volumineux. Essayez de réduire le nombre de feuilles ou de lignes dans le fichier Excel.";
            }

            return response()->json([
                'message' => 'Erreur lors de l\'import des occupations.',
                'error'   => $error,
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function importUnified(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
            'projects' => 'nullable',
            'frequentations' => 'nullable',
            'occupations' => 'nullable',
        ]);

        $importProjects = filter_var($request->input('projects'), FILTER_VALIDATE_BOOLEAN);
        $importFrequentations = filter_var($request->input('frequentations'), FILTER_VALIDATE_BOOLEAN);
        $importOccupations = filter_var($request->input('occupations'), FILTER_VALIDATE_BOOLEAN);

        if (!$importProjects && !$importFrequentations && !$importOccupations) {
            return response()->json([
                'message' => 'Veuillez sélectionner au moins une table à importer.'
            ], 400);
        }

        // Increase limits for large files
        ini_set('memory_limit', '2048M');
        set_time_limit(600);

        try {
            $imported = [];
            $ignoredOccupations = [];

            DB::transaction(function () use ($request, $importProjects, $importFrequentations, $importOccupations, &$imported, &$ignoredOccupations) {
                $file = $request->file('file');

                // 1. Import Projects
                if ($importProjects) {
                    Excel::import(new ProjectsImport, $file);
                    $imported[] = 'projets';
                }

                // 2. Import Frequentations
                if ($importFrequentations) {
                    Excel::import(new FrequentationsImport, $file);
                    $imported[] = 'fréquentations';
                }

                // 3. Import Occupations
                if ($importOccupations) {
                    $importer = new OccupationsImport();
                    Excel::import($importer, $file);
                    $ignoredOccupations = $importer->getIgnoredRows();
                    $imported[] = 'occupations';
                }
            });

            $message = "Importation réussie pour : " . implode(', ', $imported) . ".";

            return response()->json([
                'message' => $message,
                'imported' => $imported,
                'ignored_occupations' => $ignoredOccupations,
            ], 200)->header('Access-Control-Allow-Origin', '*');

        } catch (\Throwable $e) {
            // Clear caches in case of error
            FrequentationsImport::clearCaches();
            OccupationsImport::clearCaches();

            \Illuminate\Support\Facades\Log::error("Unified Import Error: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            $error = $e->getMessage();
            if (strpos($error, 'SQLSTATE') !== false || strpos($error, 'database') !== false) {
                if (strpos($error, 'responsable_projet') !== false) {
                    $error = "Le responsable de projet est manquant pour l'un des projets.";
                } else {
                    $error = "Une erreur de base de données est survenue lors de l'enregistrement des données.";
                }
            }
            if (strpos($error, 'memory') !== false || strpos($error, 'Allowed memory') !== false) {
                $error = "Le fichier est trop volumineux pour être traité. Essayez de réduire le nombre de feuilles ou de lignes dans le fichier Excel.";
            }

            return response()->json([
                'message' => 'Erreur lors de l’importation unifiée.',
                'error'   => $error,
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }
}
