<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Participant extends Model
{
    protected $fillable = ['nom'];

    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }

    public function frequentations()
    {
        return $this->belongsToMany(Frequentation::class);
    }
}
