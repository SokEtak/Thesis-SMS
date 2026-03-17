<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

it('allows inline user updates with extension-style phone numbers', function () {
    Role::findOrCreate('Admin', 'web');

    $admin = User::factory()->withoutTwoFactor()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->withoutTwoFactor()->create([
        'name' => 'Student Example',
        'email' => 'student@example.com',
        'phone' => '(555) 123-4567 x89',
    ]);

    $response = $this
        ->actingAs($admin)
        ->from(route('users.index'))
        ->put(route('users.update', $user), [
            'name' => 'Student Example',
            'email' => 'student@example.com',
            'phone' => '(555) 123-4567 x89',
            'gender' => $user->gender,
            'class_id' => $user->class_id,
            'parent_id' => $user->parent_id,
            'role' => null,
        ]);

    $response
        ->assertRedirect(route('users.index'))
        ->assertSessionHasNoErrors();

    expect($user->fresh()?->phone)->toBe('(555) 123-4567 x89');
});
