<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'fulfillment' => $this->fulfillment,
            'address' => $this->address,
            'notes' => $this->notes,
            'total_cents' => $this->total_cents,
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->items->map(fn ($i) => [
                'product_id' => $i->product_id,
                'name' => $i->name,
                'unit_price_cents' => $i->unit_price_cents,
                'quantity' => $i->quantity,
            ])->all(),
        ];
    }
}
