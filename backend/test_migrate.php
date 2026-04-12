<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "Migration successful!\n";
} catch (\Exception $e) {
    echo "\n=== MIGRATION ERROR ===\n";
    echo $e->getMessage() . "\n";
    echo "=======================\n";
}
