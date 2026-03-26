<?php
// database/seeders/ActiviteSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActiviteSeeder extends Seeder
{
    public function run()
    {
        // Liste des noms d'activités uniques (hors projets) extraits de la feuille "Fréquentation"
        $activites = [
            [
                'nom' => 'Ortheses 3D',
                'pole' => 'Pôle AIG',
                'filiere' => 'PGOSIE',
                'groupe' => '202',
            ],
            [
                'nom' => 'Initiation à la démarche projet',
                'pole' => 'Pôle AIG',
                'filiere' => 'Production graphique',
                'groupe' => '103',
            ],
            [
                'nom' => 'Formation à l’Impression 3D',
                'pole' => 'Pôle Industrie',
                'filiere' => 'GEOESA EXC',
                'groupe' => '202',
            ],
            [
                'nom' => 'Fondamentaux Arduino',
                'pole' => 'Pôle Industrie',
                'filiere' => 'Génie électrique',
                'groupe' => '101',
            ],
            [
                'nom' => 'TECHNODRILL3',
                'pole' => 'Pôle Industrie',
                'filiere' => 'GEOEAR',
                'groupe' => '201',
            ],
            [
                'nom' => 'Formation au Découpe et gravure laser',
                'pole' => 'Pôle Industrie',
                'filiere' => 'GEOEAR',
                'groupe' => '201',
            ],
            [
                'nom' => 'Module M210 : Projet de Synthése',
                'pole' => 'Pôle Industrie',
                'filiere' => 'GEOESA',
                'groupe' => '201',
            ],
            [
                'nom' => 'Module M211 : Projet de Synthése',
                'pole' => 'Pôle Industrie',
                'filiere' => 'GEOEAR',
                'groupe' => '201',
            ],
            [
                'nom' => 'Module EI : Projet de Synthése',
                'pole' => 'Pôle Industrie',
                'filiere' => 'EI',
                'groupe' => '201',
            ],
            [
                'nom' => 'Soudure Electronique  - Chargeur',
                'pole' => 'Pôle Industrie',
                'filiere' => 'Génie électrique',
                'groupe' => '101',
            ],
        ];

        foreach ($activites as $activite) {
            // Ne pas créer si le nom existe déjà comme projet
            $existsAsProject = DB::table('projects')->where('intitule_projet', $activite['nom'])->exists();
            if (!$existsAsProject) {
                DB::table('activites')->updateOrInsert(
                    ['nom' => $activite['nom']],
                    [
                        'pole' => $activite['pole'],
                        'filiere' => $activite['filiere'],
                        'groupe' => $activite['groupe'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}