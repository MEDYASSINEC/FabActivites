<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'id',
        'source_du_projet',
        'intitule_projet',
        'statut',
        'etape',
        'responsable_projet',
        'pole',
        'filiere',
        'groupe',
        'groupe',
        'dt_debut',
        'dt_fn_prevu',
        'dt_suspension',
        'dt_abandon',
        'dt_fn_reel',
        'remarques',
    ];

    public function frequent() {
        return $this->hasMany(Frequentation::class);
    }

    public function participants() {
        return $this->belongsToMany(Participant::class);
    }
}
