<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjets = [
            ['name' => 'Mathematics', 'code' => 'MATH101'],
            ['name' => 'Algebra', 'code' => 'MATH102'],
            ['name' => 'Geometry', 'code' => 'MATH103'],
            ['name' => 'English Language', 'code' => 'ENG101'],
            ['name' => 'Biology', 'code' => 'BIO101'],
            ['name' => 'Chemistry', 'code' => 'CHEM101'],
            ['name' => 'Physics', 'code' => 'PHY101'],
            ['name' => 'History', 'code' => 'HIST101'],
            ['name' => 'Geography', 'code' => 'GEO101'],
            ['name' => 'Computer', 'code' => 'CS101'],
            ['name' => 'Physical Education', 'code' => 'PE101'],
            ['name' => 'Science', 'code' => 'SCI101'],
            ['name' => 'Social Studies', 'code' => 'SS101'],
            ['name' => 'Khmer', 'code' => 'KHM101'],
            ['name' => 'Sports', 'code' => 'SPRT101'],
            ['name' => 'Economics', 'code' => 'ECON101'],
            ['name' => 'Home Economics', 'code' => 'HOM101'],
            ['name' => 'Writing', 'code' => 'WRIT101'],

        ];

        foreach ($subjets as $subject) {
            Subject::create($subject);
        }
    }
}
