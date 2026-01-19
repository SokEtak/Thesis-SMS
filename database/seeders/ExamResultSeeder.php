<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ExamResultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\ExamResult::factory()->count(10)->create();
    }
}
