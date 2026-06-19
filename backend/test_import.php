<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Imports\FrequentationsImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

ini_set('memory_limit', '2048M');
set_time_limit(600);

echo "Starting import...\n";
try {
    $file = '../Activites du FABLAB Prevues _Realisees_KPIs 2025-2026 - 20-02.xlsx';
    echo "DB Connection: " . \Illuminate\Support\Facades\DB::getDefaultConnection() . "\n";
    echo "DB Database Name: " . \Illuminate\Support\Facades\DB::connection()->getDatabaseName() . "\n";
    echo "DB Config: " . json_encode(config('database.connections.mysql')) . "\n";
    echo "Transaction Level Before: " . \Illuminate\Support\Facades\DB::transactionLevel() . "\n";
    Excel::import(new FrequentationsImport, $file);
    echo "Transaction Level After: " . \Illuminate\Support\Facades\DB::transactionLevel() . "\n";
    echo "Import successful!\n";
    echo "Frequentations Count in script: " . DB::table('frequentations')->count() . "\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
