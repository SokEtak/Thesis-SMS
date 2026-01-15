<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classroom extends Model
{
    /** @use HasFactory<\Database\Factories\ClassroomFactory> */
    use HasFactory,SoftDeletes;


    protected $table = 'classes';

    // DB column is `name`; accept both `name` and `class_name` for compatibility.
    protected $fillable = ['name', 'teacher_in_charge_id'];

    public function teacherInCharge(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_in_charge_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(User::class, 'class_id')->whereHas('roles', function ($q) {
            $q->where('name', 'Student');
        });
    }

    // public function timetables(): HasMany
    // {
    //     return $this->hasMany(Timetable::class, 'class_id');
    // }

    // public function homeworks(): HasMany
    // {
    //     return $this->hasMany(Homework::class, 'class_id');
    // }

    // public function attendances(): HasMany
    // {
    //     return $this->hasMany(Attendance::class, 'class_id');
    // }
}
