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
        // 1. Drop la table pivot problematique si elle a été créée par erreur
        Schema::dropIfExists('occupation_participant');

        // 2. Modifie la table occupations
        Schema::table('occupations', function (Blueprint $table) {
            if (!Schema::hasColumn('occupations', 'frequentation_id')) {
                $table->foreignId('frequentation_id')->nullable()->constrained('frequentations')->onDelete('cascade');
            }
            if (!Schema::hasColumn('occupations', 'participants')) {
                $table->json('participants')->nullable();
            }
        });

        // 3. Nettoie la table frequentations
        Schema::table('frequentations', function (Blueprint $table) {
            if (Schema::hasColumn('frequentations', 'occupation_id')) {
                // Drop unique constraint/index and foreign key before dropping column
                $table->dropUnique(['occupation_id']);
                $table->dropForeign(['occupation_id']);
                $table->dropColumn('occupation_id');
            }
            if (Schema::hasColumn('frequentations', 'participants')) {
                $table->dropColumn('participants');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('occupations', function (Blueprint $table) {
            $table->dropForeign(['frequentation_id']);
            $table->dropColumn('frequentation_id');
            $table->dropColumn('participants');
        });

        Schema::table('frequentations', function (Blueprint $table) {
            $table->json('participants')->nullable();
            $table->foreignId('occupation_id')->nullable()->constrained('occupations')->onDelete('cascade');
        });
    }
};
