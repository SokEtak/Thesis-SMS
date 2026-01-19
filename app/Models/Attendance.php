<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    /** @use HasFactory<\\Database\\Factories\\AttendanceFactory> */
    use HasFactory, Searchable, SoftDeletes;

    protected $fillable = [
        'student_id',
        'class_id',
        'date',
        'status',
        'recorded_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
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
