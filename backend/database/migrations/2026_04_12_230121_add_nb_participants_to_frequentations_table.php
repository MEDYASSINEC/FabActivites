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
        Schema::table('frequentations', function (Blueprint $table) {
            $table->integer('nb_participants')->nullable()->after('heur_fin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('frequentations', function (Blueprint $table) {
            $table->dropColumn('nb_participants');
        });
    }
};
