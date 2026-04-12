<?php

namespace Database\Seeders;

use App\Models\ZoneOccupee;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ZoneOccupeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ZoneOccupee::insert([
            ['name' => "Assemblage Électronique"],
            ['name' => "Prototypage Mécanique"],
            ['name' => "Assemblage Mécanique"],
            ['name' => "Brainstorming"],
            ['name' => "Prototypage par impression 3D"],
            ['name' => "Conception et Scanner 3D"],
            ['name' => "Prototypage Électronique"],
        ]);
    }
}
