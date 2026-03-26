<?php
// database/seeders/OccupationSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OccupationSeeder extends Seeder
{
    public function run()
    {
        $occupations = [
            ['zone_occupee' => 'Assemblage Électronique', 'outillage_machine' => 'Outillage Électronique'],
            ['zone_occupee' => 'Prototypage Mécanique', 'outillage_machine' => 'Machine Laser Aeon Elite Eko 14'],
            ['zone_occupee' => 'Assemblage Mécanique', 'outillage_machine' => 'Outillage Mécanique'],
            ['zone_occupee' => 'Brainstorming', 'outillage_machine' => 'Aucune exploitation des machines'],
            ['zone_occupee' => 'Prototypage par impression 3D', 'outillage_machine' => 'Imprimante 3D Zimorph i500'],
            ['zone_occupee' => 'Prototypage par impression 3D', 'outillage_machine' => 'Imprimante 3D Ultimaker S5'],
            ['zone_occupee' => 'Conception et Scanner 3D', 'outillage_machine' => 'Poste de Conception'],
            ['zone_occupee' => 'Prototypage Électronique', 'outillage_machine' => 'CNC Technodrill 3 pour PCB'],
            // Ajoutez ici toutes les combinaisons uniques de la feuille "Occupation"
        ];

        foreach ($occupations as $occ) {
            DB::table('occupations')->updateOrInsert(
                [
                    'zone_occupee' => $occ['zone_occupee'],
                    'outillage_machine' => $occ['outillage_machine'],
                ],
                [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}