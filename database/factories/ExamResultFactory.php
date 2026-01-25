<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\User;
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
            'score' => $this->faker->randomFloat(2, 1, 125),
            'exam_date' => $this->faker->date('Y-m-d'),
            'subject_id' => Subject::factory(),
            'student_id' => User::factory(),
        ];
    }
}
