<?php

use App\Http\Controllers\ActiviteController;
use App\Http\Controllers\FrequentationController;
use App\Http\Controllers\FrequentationProcessController;
use App\Http\Controllers\OccupationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TypeActiviteController;
use App\Http\Controllers\ZoneOccupeeController;
use App\Http\Controllers\OutillageController;
use App\Http\Controllers\ExcelImportController;
use Illuminate\Support\Facades\Route;


Route::get('/frequentations/process', [FrequentationProcessController::class, 'index']);
Route::post('/frequentations/process', [FrequentationProcessController::class, 'createFrequentation']);
Route::put('/frequentations/process/{id}', [FrequentationProcessController::class, 'updateFrequentation']);
Route::delete('/frequentations/process/{id}', [FrequentationProcessController::class, 'deleteFrequentation']);

// Excel Import Routes
Route::post('/import/projects', [ExcelImportController::class, 'importProjects']);
Route::post('/import/frequentations', [ExcelImportController::class, 'importFrequentations']);


Route::apiResource('projects', ProjectController::class);
Route::apiResource('occupations', OccupationController::class);
Route::apiResource('activites', ActiviteController::class);
Route::apiResource('frequentations', FrequentationController::class);

Route::apiResource('type-activites', TypeActiviteController::class);
Route::apiResource('zone-occupees', ZoneOccupeeController::class);
Route::apiResource('outillages', OutillageController::class);
