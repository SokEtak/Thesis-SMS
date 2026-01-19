<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class LeaveRequestSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\LeaveRequest::factory()->count(10)->create();
    }
}
