<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Ajout des colonnes heur_debut et heur_fin à occupations
        Schema::table('occupations', function (Blueprint $table) {
            if (!Schema::hasColumn('occupations', 'heur_debut')) {
                $table->dateTime('heur_debut')->nullable();
            }
            if (!Schema::hasColumn('occupations', 'heur_fin')) {
                $table->dateTime('heur_fin')->nullable();
            }
        });

        // La table pivot est abandonnée pour ce projet.
    }

    public function down()
    {
        // Suppression des colonnes ajoutées
        Schema::table('occupations', function (Blueprint $table) {
            if (Schema::hasColumn('occupations', 'heur_debut')) {
                $table->dropColumn('heur_debut');
            }
            if (Schema::hasColumn('occupations', 'heur_fin')) {
                $table->dropColumn('heur_fin');
            }
        });
    }
};
