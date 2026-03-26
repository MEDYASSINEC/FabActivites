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
            $table->string('source_du_projet');
            $table->string('intitule_projet');
            $table->string('statut');
            $table->string('etape');
            $table->string('responsable_projet');
            $table->string('pole');
            $table->string('filiere');
            $table->string('groupe');
            $table->bigInteger('nombre_participant');
            $table->date('dt_debut');
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
