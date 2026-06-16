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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('source_du_projet')->nullable();
            $table->string('intitule_projet')->nullable();
            $table->string('statut')->nullable();
            $table->string('etape')->nullable();
            $table->string('responsable_projet')->nullable();
            $table->string('pole')->nullable();
            $table->string('filiere')->nullable();
            $table->string('groupe')->nullable();
            $table->date('dt_debut')->nullable();
            $table->date('dt_fn_prevu')->nullable();
            $table->date('dt_suspension')->nullable();
            $table->date('dt_abandon')->nullable();
            $table->date('dt_fn_reel')->nullable();
            $table->string('remarques')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
