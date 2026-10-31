<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $over = []): array
    {
        return array_merge([
            'name' => 'Maria Silva',
            'email' => 'maria@example.com',
            'password' => 'password123',
            'shop_name' => 'Loja da Maria',
            'phone' => '11999990000',
        ], $over);
    }

    public function test_register_creates_user_shop_and_token(): void
    {
        $this->postJson('/api/auth/register', $this->payload())
            ->assertCreated()
            ->assertJsonPath('user.shop.slug', 'loja-da-maria')
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'shop' => ['id', 'name', 'slug']]]);

        $this->assertDatabaseHas('shops', ['slug' => 'loja-da-maria']);
    }

    public function test_slug_is_unique_when_names_collide(): void
    {
        $this->postJson('/api/auth/register', $this->payload())->assertCreated();
        $this->postJson('/api/auth/register', $this->payload(['email' => 'b@example.com']))
            ->assertCreated()
            ->assertJsonPath('user.shop.slug', 'loja-da-maria-2');
    }

    public function test_register_validates_input(): void
    {
        User::factory()->create(['email' => 'maria@example.com']);

        $this->postJson('/api/auth/register', $this->payload(['password' => 'short']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_and_me(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        Shop::factory()->create(['user_id' => $user->id]);

        $token = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password123'])
            ->assertOk()
            ->json('token');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.shop.id', $user->shop->id);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
