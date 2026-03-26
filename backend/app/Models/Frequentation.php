<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Frequentation extends Model
{
    protected $fillable = [
        'id',
        'participants',
        'type_activite',
        'project_id',
        'activite_id',
        'occupation_id',
        'etape',
        'intervenant',
        'role',
        'heur_debut',
        'heur_fin',
        'date',
    ];

    protected $casts = [
        'participants' => 'array',
    ];


    public function occupation (){
        return $this->belongsTo(Occupation::class);
    } 

    public function activite (){
        return $this->belongsTo(Activite::class);
    }

    public function project (){
        return $this->belongsTo(Project::class);
    }
}
