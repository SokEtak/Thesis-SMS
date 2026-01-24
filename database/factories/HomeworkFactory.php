<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Classroom;
use App\Models\Subject;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Homework>
 */
class HomeworkFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'class_id' => Classroom::inRandomOrder()->value('id'),
            'subject_id' => Subject::inRandomOrder()->value('id'),
            'teacher_id' => User::role('Teacher')->inRandomOrder()->value('id'),
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'file_url' => $this->faker->url,
            'deadline' => $this->faker->dateTimeBetween('now', '+1 month'),
        ];
    }
}
