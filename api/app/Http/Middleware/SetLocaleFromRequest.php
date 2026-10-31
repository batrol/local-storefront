<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Picks the response language from Accept-Language; English is the default. */
class SetLocaleFromRequest
{
    public const SUPPORTED = ['en', 'pt_BR'];

    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale($request->getPreferredLanguage(self::SUPPORTED) ?? config('app.locale'));

        return $next($request);
    }
}
