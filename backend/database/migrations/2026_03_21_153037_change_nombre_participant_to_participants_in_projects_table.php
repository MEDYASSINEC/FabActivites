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
        Schema::table('projects', function (Blueprint $table) {
            $table->renameColumn('nombre_participant', 'participants');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->json('participants')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->bigInteger('participants')->change();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->renameColumn('participants', 'nombre_participant');
        });
    }
};
