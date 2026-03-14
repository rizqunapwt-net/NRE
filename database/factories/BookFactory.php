<?php

namespace Database\Factories;

use App\Models\Author;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'author_id' => Author::factory(),
            'category_id' => Category::factory(),
            'title' => $title,
            'slug' => Str::slug($title) . '-' . fake()->unique()->randomNumber(4),
            'isbn' => fake()->unique()->numerify('978##########'),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 0, 200000),
            'status' => fake()->randomElement(['published', 'draft', 'production']),
            'is_published' => true,
            'is_digital' => true,
            'language' => 'Bahasa Indonesia',
            'publisher' => 'Rizquna Publishing',
            'publisher_city' => 'Jakarta',
            'page_count' => fake()->numberBetween(100, 500),
            'published_year' => fake()->year(),
            'published_at' => now(),
        ];
    }

    /**
     * Indicate that the book is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    /**
     * Indicate that the book has zero price.
     */
    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => 0,
        ]);
    }

    /**
     * Indicate that the book has a price.
     */
    public function withPrice(float $price): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => $price,
        ]);
    }
}
