<?php

use App\Models\Activite;
use App\Models\Occupation;
use App\Models\Project;
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
        Schema::create('frequentations', function (Blueprint $table) {
            $table->id();
            $table->json('participants');
            $table->string('type_activite');
            $table->foreignIdFor(Project::class)->nullable()->constrained()->onDelete("cascade");
            $table->foreignIdFor(Activite::class)->nullable()->constrained()->onDelete("cascade");
            $table->foreignIdFor(Occupation::class)->nullable()->unique()->constrained()->onDelete("cascade");
            $table->string('etape')->nullable();
            $table->string('intervenant')->nullable();
            $table->string('role')->nullable();
            $table->time('heur_debut');
            $table->time('heur_fin');
            $table->date('date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('frequentations');
    }
};
