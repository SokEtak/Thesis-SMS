<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('name')->nullable()->after('student_id');
            $table->string('email')->nullable()->after('name');
            $table->string('password')->nullable()->after('email');
            $table->string('telegram_chat_id')->nullable()->after('password');
            $table->string('avatar')->nullable()->after('telegram_chat_id');
            $table->string('phone')->nullable()->after('avatar');
            $table->enum('gender', ['male', 'female'])->nullable()->after('phone');
            $table->date('dob')->nullable()->after('gender');
            $table->string('position', 50)->nullable()->after('dob');
            $table->string('address')->nullable()->after('position');
            $table->foreignId('parent_id')->nullable()->after('address')
                ->constrained('users')->nullOnDelete();
            $table->text('two_factor_secret')->nullable()->after('parent_id');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            $table->rememberToken()->after('two_factor_confirmed_at');
        });

        DB::table('attendances')
            ->chunkById(200, function ($rows): void {
                $studentIds = $rows
                    ->pluck('student_id')
                    ->filter()
                    ->unique()
                    ->values();

                if ($studentIds->isEmpty()) {
                    return;
                }

                $students = DB::table('users')
                    ->whereIn('id', $studentIds)
                    ->select([
                        'id',
                        'name',
                        'email',
                        'password',
                        'telegram_chat_id',
                        'avatar',
                        'phone',
                        'gender',
                        'dob',
                        'position',
                        'address',
                        'parent_id',
                        'two_factor_secret',
                        'two_factor_recovery_codes',
                        'two_factor_confirmed_at',
                        'remember_token',
                    ])
                    ->get()
                    ->keyBy('id');

                foreach ($rows as $row) {
                    $student = $students->get($row->student_id);
                    if (! $student) {
                        continue;
                    }

                    DB::table('attendances')
                        ->where('id', $row->id)
                        ->update([
                            'name' => $student->name,
                            'email' => $student->email,
                            'password' => $student->password,
                            'telegram_chat_id' => $student->telegram_chat_id,
                            'avatar' => $student->avatar,
                            'phone' => $student->phone,
                            'gender' => $student->gender,
                            'dob' => $student->dob,
                            'position' => $student->position,
                            'address' => $student->address,
                            'parent_id' => $student->parent_id,
                            'two_factor_secret' => $student->two_factor_secret,
                            'two_factor_recovery_codes' => $student->two_factor_recovery_codes,
                            'two_factor_confirmed_at' => $student->two_factor_confirmed_at,
                            'remember_token' => $student->remember_token,
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn([
                'name',
                'email',
                'password',
                'telegram_chat_id',
                'avatar',
                'phone',
                'gender',
                'dob',
                'position',
                'address',
                'parent_id',
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
                'remember_token',
            ]);
        });
    }
};
