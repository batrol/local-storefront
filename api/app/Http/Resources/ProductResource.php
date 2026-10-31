<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price_cents' => $this->price_cents,
            'stock' => $this->stock,
            'low_stock_threshold' => $this->low_stock_threshold,
            'low_stock' => $this->isLowStock(),
            'active' => $this->active,
            'image_url' => $this->image_url,
            'category' => new CategoryResource($this->whenLoaded('category')),
        ];
    }
}
