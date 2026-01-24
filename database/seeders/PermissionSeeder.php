<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Subject Permissions
            'subjects.view-any',
            'subjects.view',
            'subjects.create',
            'subjects.update',
            'subjects.delete',
            'subjects.restore',
            'subjects.force-delete',
            'subjects.import',
            'subjects.export',

            // User Permissions
            'users.view-any',
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'users.restore',
            'users.force-delete',
            'users.import',
            'users.export',

            // Classroom Permissions
            'classrooms.view-any',
            'classrooms.view',
            'classrooms.create',
            'classrooms.update',
            'classrooms.delete',
            'classrooms.restore',
            'classrooms.force-delete',
            'classrooms.import',
            'classrooms.export',

            // Timetable Permissions
            'timetables.view-any',
            'timetables.view',
            'timetables.create',
            'timetables.update',
            'timetables.delete',
            'timetables.restore',
            'timetables.force-delete',
            'timetables.import',
            'timetables.export',

            // Attendance Permissions
            'attendance.view-any',
            'attendance.view',
            'attendance.create',
            'attendance.update',
            'attendance.delete',
            'attendance.restore',
            'attendance.force-delete',
            'attendance.import',
            'attendance.export',

            // Leave Request Permissions
            'leaverequests.view-any',
            'leaverequests.view',
            'leaverequests.create',
            'leaverequests.update',
            'leaverequests.delete',
            'leaverequests.restore',
            'leaverequests.force-delete',
            'leaverequests.import',
            'leaverequests.export',

            // Homework Permissions
            'homeworks.view-any',
            'homeworks.view',
            'homeworks.create',
            'homeworks.update',
            'homeworks.delete',
            'homeworks.restore',
            'homeworks.force-delete',
            'homeworks.import',
            'homeworks.export',

            // Homework Submission Permissions
            'homework_submissions.view-any',
            'homework_submissions.view',
            'homework_submissions.create',
            'homework_submissions.update',
            'homework_submissions.delete',
            'homework_submissions.restore',
            'homework_submissions.force-delete',
            'homework_submissions.import',
            'homework_submissions.export',


        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
