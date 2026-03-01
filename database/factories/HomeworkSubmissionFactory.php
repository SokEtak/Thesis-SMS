<?php

namespace Database\Factories;

use App\Models\Homework;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\HomeworkSubmission>
 */
class HomeworkSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'homework_id' => Homework::factory(),
            'student_id' => User::factory(),
            'file_url' => $this->faker->url,
            'submitted_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'score' => $this->faker->optional()->numberBetween(0, 100),
            'feedback' => $this->faker->optional()->paragraph,
        ];
    }
}
