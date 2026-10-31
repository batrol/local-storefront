<?php

namespace App\Repositories;

use App\Models\Shop;
use App\Models\User;

class ShopRepository
{
    /** @param array{name: string, phone?: string|null} $data */
    public function createFor(User $user, array $data, string $slug): Shop
    {
        return $user->shop()->create([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'slug' => $slug,
        ]);
    }

    public function slugExists(string $slug): bool
    {
        return Shop::query()->where('slug', $slug)->exists();
    }

    public function findBySlug(string $slug): ?Shop
    {
        return Shop::query()->where('slug', $slug)->first();
    }
}
