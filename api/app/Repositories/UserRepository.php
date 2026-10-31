<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    /** @param array{name: string, email: string, password: string} $data */
    public function create(array $data): User
    {
        return User::query()->create($data);
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }
}
