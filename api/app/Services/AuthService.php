<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\ShopRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly ShopRepository $shops,
    ) {}

    /**
     * @param  array{name: string, email: string, password: string, shop_name: string, phone?: string|null}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = DB::transaction(function () use ($data) {
            $user = $this->users->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            $this->shops->createFor(
                $user,
                ['name' => $data['shop_name'], 'phone' => $data['phone'] ?? null],
                $this->uniqueSlug($data['shop_name']),
            );

            return $user;
        });

        return ['user' => $user->load('shop'), 'token' => $user->createToken('web')->plainTextToken];
    }

    /** @return array{user: User, token: string} */
    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages(['email' => [__('Invalid credentials.')]]);
        }

        return ['user' => $user->load('shop'), 'token' => $user->createToken('web')->plainTextToken];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'shop';
        $slug = $base;
        $i = 2;
        while ($this->shops->slugExists($slug)) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
