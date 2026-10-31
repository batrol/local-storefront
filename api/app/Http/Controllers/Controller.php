<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function shopId(Request $request): int
    {
        return $request->user()->shop->id;
    }
}
