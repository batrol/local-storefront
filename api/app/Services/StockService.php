<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockService
{
    /**
     * Apply a stock change and log it. Stock never goes below zero.
     * Re-reads the row under lock so concurrent orders cannot oversell.
     */
    public function adjust(Product $product, int $delta, string $reason): Product
    {
        return DB::transaction(function () use ($product, $delta, $reason) {
            $locked = Product::query()->lockForUpdate()->findOrFail($product->id);
            $balance = $locked->stock + $delta;

            if ($balance < 0) {
                throw ValidationException::withMessages(['delta' => ['Insufficient stock.']]);
            }

            $locked->update(['stock' => $balance]);
            StockMovement::query()->create([
                'product_id' => $locked->id,
                'delta' => $delta,
                'balance' => $balance,
                'reason' => $reason,
            ]);

            return $locked->load('category');
        });
    }
}
