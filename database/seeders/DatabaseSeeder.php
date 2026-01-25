<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            SubjectSeeder::class,
            ClassroomSeeder::class,
            UserSeeder::class,
            TimetableSeeder::class,
            HomeworkSeeder::class,
            AttendanceSeeder::class,
            ClassroomSeeder::class,
            ExamResultSeeder::class,
        ]);
    }
}
