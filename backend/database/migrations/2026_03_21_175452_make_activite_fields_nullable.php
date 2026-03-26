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
        Schema::table('activites', function (Blueprint $table) {
            $table->string('nom')->nullable()->change();
            $table->string('pole')->nullable()->change();
            $table->string('filiere')->nullable()->change();
            $table->string('groupe')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activites', function (Blueprint $table) {
            $table->string('nom')->nullable(false)->change();
            $table->string('pole')->nullable(false)->change();
            $table->string('filiere')->nullable(false)->change();
            $table->string('groupe')->nullable(false)->change();
        });
    }
};
