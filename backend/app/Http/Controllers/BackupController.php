<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    public function download()
    {
        $connection = config('database.default');

        if ($connection === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');
            if (!file_exists($dbPath)) {
                $dbPath = database_path('database.sqlite');
            }
            if (file_exists($dbPath)) {
                $filename = 'backup_database_' . date('Y-m-d_H-i-s') . '.sqlite';
                return response()->download($dbPath, $filename, [
                    'Content-Type' => 'application/x-sqlite3',
                ]);
            }
        }

        // Générer un export SQL générique pour MySQL
        $filename = 'backup_database_' . date('Y-m-d_H-i-s') . '.sql';
        
        $response = new StreamedResponse(function () {
            $tables = [];
            try {
                $dbName = config('database.connections.mysql.database');
                $tablesList = DB::select('SHOW TABLES');
                $key = 'Tables_in_' . $dbName;
                foreach ($tablesList as $t) {
                    if (isset($t->$key)) {
                        $tables[] = $t->$key;
                    }
                }
            } catch (\Exception $e) {
                // En cas d'erreur de récupération des tables
            }

            echo "SET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                if (in_array($table, ['migrations', 'failed_jobs', 'personal_access_tokens'])) {
                    continue;
                }

                echo "-- Structure de la table `$table` --\n";
                echo "DROP TABLE IF EXISTS `$table`;\n";
                
                try {
                    $createTable = DB::select("SHOW CREATE TABLE `$table`")[0]->{'Create Table'} ?? null;
                    if ($createTable) {
                        echo $createTable . ";\n\n";
                    }
                } catch (\Exception $e) {
                    // En cas d'incompatibilité
                }

                echo "-- Données de la table `$table` --\n";
                $rows = DB::table($table)->get();
                foreach ($rows as $row) {
                    $rowArray = (array)$row;
                    $columns = array_keys($rowArray);
                    $escapedValues = array_map(function ($value) {
                        if (is_null($value)) return 'NULL';
                        return "'" . addslashes($value) . "'";
                    }, array_values($rowArray));

                    echo "INSERT INTO `$table` (`" . implode("`, `", $columns) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                }
                echo "\n";
            }
            
            echo "SET FOREIGN_KEY_CHECKS=1;\n";
        });

        $response->headers->set('Content-Type', 'application/sql');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        
        return $response;
    }
}
