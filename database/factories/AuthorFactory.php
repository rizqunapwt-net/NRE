<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Author>
 */
class AuthorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'pen_name' => fake()->optional()->name(),
            'bio' => fake()->optional()->paragraph(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'province' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'bank_name' => fake()->randomElement(['BCA', 'Mandiri', 'BRI', 'BNI']),
            'bank_account' => fake()->numerify('##########'),
            'bank_account_name' => fake()->name(),
            'npwp' => fake()->numerify('##.###.###.#-###.###'),
            'status' => 'active',
            'royalty_percentage' => fake()->randomFloat(2, 5, 15),
            'is_profile_complete' => true,
        ];
    }

    /**
     * Indicate that the author is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the author is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
