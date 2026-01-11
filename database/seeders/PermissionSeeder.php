<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
