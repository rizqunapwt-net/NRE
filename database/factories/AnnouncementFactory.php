<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'content' => fake()->paragraphs(3, true),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'published_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'expires_at' => null,
            'department' => null,
            'is_active' => true,
            'image_url' => null,
            'file_url' => null,
            'view_count' => fake()->numberBetween(0, 1000),
            'created_by' => User::factory(),
        ];
    }

    /**
     * Indicate that the announcement is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the announcement is not yet published.
     */
    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->addDays(fake()->numberBetween(1, 30)),
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the announcement is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the announcement has high priority.
     */
    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'high',
        ]);
    }

    /**
     * Indicate that the announcement has expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->subDays(30),
            'expires_at' => now()->subDays(1),
        ]);
    }
}
