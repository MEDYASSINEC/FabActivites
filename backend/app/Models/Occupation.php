<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Occupation extends Model
{
    protected $fillable = [
        "zone_occupee",
        'outillage_machine',
        'heur_debut',
        'heur_fin',
        'frequentation_id',
        'date'
    ];

    // Une occupation appartient à une fréquentation
    public function frequentation() {
        return $this->belongsTo(Frequentation::class);
    }
}
