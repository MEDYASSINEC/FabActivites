<?php

namespace Database\Seeders;

use App\Models\Outillage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OutillageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Outillage::insert([
            ['name' => "Outillage Électronique"],
            ['name' => "Machine Laser Aeon Elite Eko 14"],
            ['name' => "Outillage Mécanique"],
            ['name' => "Aucune exploitation des machines"],
            ['name' => "Imprimante 3D Zimorph i500"],
            ['name' => "Poste de Conception"],
            ['name' => "Imprimante 3D Ultimaker S5"],
            ['name' => "CNC Technodrill 3 pour PCB"],
        ]);
    }
}
