<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Frequentation extends Model
{
    protected $fillable = [
        'id',
        'type_activite',
        'project_id',
        'activite_id',
        'etape',
        'intervenant',
        'role',
        'heur_debut',
        'heur_fin',
        'date',
        'nb_participants',
    ];

    // Une fréquentation a plusieurs occupations
    public function occupations (){
        return $this->hasMany(Occupation::class);
    }

    // (Suppression de la relation occupation() obsolète)

    public function activite (){
        return $this->belongsTo(Activite::class);
    }

    public function project (){
        return $this->belongsTo(Project::class);
    }
}
