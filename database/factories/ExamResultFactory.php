<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamResult>
 */
class ExamResultFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'exam_type' => $this->faker->randomElement(['Midterm', 'Final', 'Quiz', 'Assignment']),
            'score' => $this->faker->randomFloat(2, 0, 100),
            'month_year' => $this->faker->date('F Y'),
            'subject_id' => \App\Models\Subject::factory(),
            'student_id' => \App\Models\User::factory(),
        ];
    }
}
