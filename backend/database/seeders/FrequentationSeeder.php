<?php
// database/seeders/FrequentationSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FrequentationSeeder extends Seeder
{
    public function run()
    {
        // Sessions regroupées (date, nom activité, horaires, participants)
        // Extrait de la feuille "Fréquentation" (échantillon, à compléter avec toutes les lignes)
        $sessions = [
            [
                'date' => '2025-10-09',
                'type_activite' => 'Projet de classe',
                'nom_activite' => 'Soudure Electronique  - Trafic Light',
                'etape' => 'Séance ponctuelle',
                'intervenant' => 'NA',
                'role' => 'NA',
                'heure_debut' => '15:10:00',
                'heure_fin' => '16:00:00',
                'pole' => 'Pôle Industrie',
                'filiere' => 'GEOEAR',
                'groupe' => '201',
                'participants' => ['EL ATTAR MAROUAN', 'ELKHAYAT HAMZA', 'ZEDAK YASSER', 'Kassas Jamila'],
            ],
            [
                'date' => '2025-10-10',
                'type_activite' => 'Projet de classe',
                'nom_activite' => 'PIE : Maquette Infermerie',
                'etape' => 'Séance ponctuelle',
                'intervenant' => 'NA',
                'role' => 'NA',
                'heure_debut' => '09:30:00',
                'heure_fin' => '14:50:00',
                'pole' => 'Pôle Santé',
                'filiere' => 'Ambulancier',
                'groupe' => '101',
                'participants' => ['Fatima Zohra boulesâad', 'Aziza El mokkadem', 'Mohamed Jania', 'Anas Bouzam', 'Fatima Zohra Yaakoubi', 'Houssam Boujdad'],
            ],
            [
                'date' => '2025-10-10',
                'type_activite' => 'Projet de classe',
                'nom_activite' => 'PIE : Maquette Espace de restauration',
                'etape' => 'Séance ponctuelle',
                'intervenant' => 'NA',
                'role' => 'NA',
                'heure_debut' => '09:30:00',
                'heure_fin' => '15:30:00',
                'pole' => 'Pôle Santé',
                'filiere' => 'Ambulancier',
                'groupe' => '101',
                'participants' => ['Jaouad Riahi', 'Anas hichou', 'Khaoula Elaouaoucha'],
            ],
            [
                'date' => '2025-10-10',
                'type_activite' => 'Projet de classe',
                'nom_activite' => 'PIE : Maquette Distribution de Café',
                'etape' => 'Séance ponctuelle',
                'intervenant' => 'NA',
                'role' => 'NA',
                'heure_debut' => '13:00:00',
                'heure_fin' => '16:30:00',
                'pole' => 'Pôle Santé',
                'filiere' => 'Radiologie diagnostique',
                'groupe' => '101',
                'participants' => ['Ikram El souini', 'Akdi Hanae', 'Ed-daky Chaimae'],
            ],
            // Ajoutez toutes les autres sessions ici
        ];

        foreach ($sessions as $session) {
            $project = DB::table('projects')->where('intitule_projet', $session['nom_activite'])->first();
            $activite = null;
            if (!$project) {
                $activite = DB::table('activites')->where('nom', $session['nom_activite'])->first();
            }

            DB::table('frequentations')->insert([
                'participants' => json_encode($session['participants']),
                'type_activite' => $session['type_activite'],
                'project_id' => $project ? $project->id : null,
                'activite_id' => $activite ? $activite->id : null,
                'occupation_id' => null, // à relier si les données d'occupation sont disponibles
                'etape' => $session['etape'],
                'intervenant' => $session['intervenant'],
                'role' => $session['role'],
                'heur_debut' => $session['heure_debut'],
                'heur_fin' => $session['heure_fin'],
                'date' => $session['date'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}