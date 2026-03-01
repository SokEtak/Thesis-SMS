<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = User::role('Student')->get()->shuffle();
        $teachers = User::role('Teacher')->get();

        $statuses = ['pre', 'a', 'per', 'l']; // present, absent, permission, leave

        // Create random attendance records
        foreach ($students as $student) {
            for ($i = 0; $i < 30; $i++) {
                $date = now()->subDays($i);
                
                // Skip weekends
                if ($date->dayOfWeek >= 5) continue;

                Attendance::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'class_id' => $student->class_id,
                        'date' => $date->toDateString(),
                    ],
                    [
                        'status' => $statuses[array_rand($statuses)],
                        'recorded_by' => $teachers->isNotEmpty() ? $teachers->random()->id : null,
                    ]
                );
            }
        }
    }
}
