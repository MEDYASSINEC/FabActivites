<?php

use App\Http\Controllers\ActiviteController;
use App\Http\Controllers\FrequentationController;
use App\Http\Controllers\FrequentationProcessController;
use App\Http\Controllers\OccupationController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;


Route::get('/frequentations/process', [FrequentationProcessController::class, 'index']);
Route::post('/frequentations/process', [FrequentationProcessController::class, 'createFrequentation']);
Route::put('/frequentations/process/{id}', [FrequentationProcessController::class, 'updateFrequentation']);
Route::delete('/frequentations/process/{id}', [FrequentationProcessController::class, 'deleteFrequentation']);


Route::apiResource('projects', ProjectController::class);
Route::apiResource('occupations', OccupationController::class);
Route::apiResource('activites', ActiviteController::class);
Route::apiResource('frequentations', FrequentationController::class);
