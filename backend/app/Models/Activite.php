<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activite extends Model
{
    protected $fillable = [
        'nom',
        'pole',
        'filiere',
        'groupe'
    ];

    public function frequent()
    {
        return $this->hasOne(Frequentation::class);
    }
}
