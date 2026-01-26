<?php

use App\Models\User;
use App\Models\Classes;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// it('can create a class', function () {
//     $class = \App\Models\Classes::factory()->create([
//         'name' => 'Grade 1',
//     ]);
//     expect($class->name)->toBe('Grade 1');
// });

// it('can assign a teacher in charge to a class', function () {
//     $teacher = User::factory()->create(['position' => 'Teacher']);
//     $class = \App\Models\Classes::factory()->create([
//         'teacher_in_charge_id' => $teacher->id,
//     ]);
//     expect($class->teacher_in_charge_id)->toBe($teacher->id);
// });

it('can soft delete a class', function () {
    $class = \App\Models\Classroom::factory()->create();

    $class->delete();

    $this->assertSoftDeleted('classrooms', [
        'id' => $class->id,
    ]);
});
