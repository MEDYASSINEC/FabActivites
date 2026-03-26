<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Occupation extends Model
{
    protected $fillable = [
        "zone_occupee",
        'outillage_machine'
    ];

    public function frequent() {
        return $this->hasOne(Frequentation::class);
    }
}
