<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Migrate Projects Participants
        $projects = DB::table('projects')->whereNotNull('participants')->get();
        foreach ($projects as $project) {
            $participants = json_decode($project->participants, true) ?: [];
            foreach ($participants as $name) {
                $name = trim($name);
                if (empty($name)) continue;

                $participantId = DB::table('participants')->where('nom', $name)->value('id');
                if (!$participantId) {
                    $participantId = DB::table('participants')->insertGetId([
                        'nom' => $name,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('participant_project')->insertOrIgnore([
                    'project_id' => $project->id,
                    'participant_id' => $participantId,
                ]);
            }
        }

        // 2. Migrate Occupations Participants to Frequentation
        $occupations = DB::table('occupations')->whereNotNull('participants')->get();
        foreach ($occupations as $occ) {
            if (!$occ->frequentation_id) continue;
            $participants = json_decode($occ->participants, true) ?: [];
            foreach ($participants as $name) {
                $name = trim($name);
                if (empty($name)) continue;

                $participantId = DB::table('participants')->where('nom', $name)->value('id');
                if (!$participantId) {
                    $participantId = DB::table('participants')->insertGetId([
                        'nom' => $name,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('frequentation_participant')->insertOrIgnore([
                    'frequentation_id' => $occ->frequentation_id,
                    'participant_id' => $participantId,
                ]);
            }
        }

        // 3. Drop JSON columns
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('participants');
        });

        Schema::table('occupations', function (Blueprint $table) {
            $table->dropColumn('participants');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->json('participants')->nullable();
        });

        Schema::table('occupations', function (Blueprint $table) {
            $table->json('participants')->nullable();
        });
    }
};
