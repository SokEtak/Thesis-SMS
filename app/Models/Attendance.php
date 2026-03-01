<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Attendance extends Model
{
    /** @use HasFactory<\\Database\\Factories\\AttendanceFactory> */
    use HasFactory, Searchable, SoftDeletes;

    protected $fillable = [
        'student_id',
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
        'class_id',
        'date',
        'status',
        'recorded_by',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected $casts = [
        'date' => 'date',
        'dob' => 'date',
        'two_factor_confirmed_at' => 'datetime',
    ];

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'position' => $this->position,
            'address' => $this->address,
            'parent_id' => $this->parent_id,
            'class_id' => $this->class_id,
            'date' => $this->date,
            'status' => $this->status,
            'recorded_by' => $this->recorded_by,
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
