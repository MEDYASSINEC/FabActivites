<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('occupations', function (Blueprint $table) {
            $table->id();
            $table->string('zone_occupee')->nullable();
            $table->string('outillage_machine')->nullable();
            $table->time('heur_debut')->nullable();
            $table->time('heur_fin')->nullable();
            $table->date('date')->nullable();
            $table->foreignId('frequentation_id')->nullable()->constrained('frequentations')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('occupations');
    }
};
