<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PublicShopController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/shops/{slug}', [PublicShopController::class, 'show']);
Route::get('/shops/{slug}/products', [PublicShopController::class, 'products']);
Route::post('/shops/{slug}/orders', [PublicShopController::class, 'order'])->middleware('throttle:30,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('categories', CategoryController::class)->except('show');
    Route::apiResource('products', ProductController::class);
    Route::post('/products/{id}/stock', [ProductController::class, 'adjustStock']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});
