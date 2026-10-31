<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $req = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price_cents' => [$req, 'integer', 'min:0', 'max:100000000'],
            'category_id' => ['nullable', 'integer'],
            'stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'active' => ['sometimes', 'boolean'],
            'image_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
