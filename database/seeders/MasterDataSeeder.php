<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            SubjectSeeder::class,
            PermissionSeeder::class,
            ClassroomSeeder::class,
            UserSeeder::class,
            TimetableSeeder::class,
        ]);
    }
}
