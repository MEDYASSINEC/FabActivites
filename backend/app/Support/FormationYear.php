<?php

namespace App\Support;

use Carbon\CarbonImmutable;

class FormationYear
{
    public static function getFormationYearStart(?CarbonImmutable $now = null): CarbonImmutable
    {
        $now = $now ?? CarbonImmutable::now();
        $year = $now->month >= 9 ? $now->year : $now->year - 1;

        return CarbonImmutable::create($year, 9, 1)->startOfDay();
    }
}
