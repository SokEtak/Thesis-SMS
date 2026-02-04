<?php

// for seeding users with roles

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = ['Super-Admin', 'Admin', 'Teacher', 'Student', 'Guardian'];

        // generate 50 random users with either Student or Guardian role
        User::factory()
            ->count(50)
            ->studentOrGuardian()
            ->create();

        foreach ($roles as $role) {
            $email = strtolower(str_replace(' ', '.', $role)).'@gmail.com';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $role.' User',
                    'password' => Hash::make('password'),
                    'avatar' => 'https://i.pravatar.cc/300',
                    'phone' => '1234567890',
                    'gender' => 'male',
                    'dob' => '1990-01-01',
                    'class_id' => rand(1, 10),
                    'parent_id' => rand(1, 10),
                    'address' => '123 Main St, Anytown, USA',
                ]
            );

            $user->assignRole($role);
        }
    }
}
