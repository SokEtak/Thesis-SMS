<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class ExamResult extends Model
{
    use HasFactory, Searchable, SoftDeletes;

    protected $fillable = [
        'student_id',
        'subject_id',
        'exam_type',
        'exam_date',
        'score',
        'recorded_by',
        'remark',
        'status',
    ];

    protected $casts = [
        'exam_date' => 'date',
    ];

    public function toSearchableArray()
    {
        return [
            'student_id' => $this->student_id,
            'subject_id' => $this->subject_id,
            'exam_type' => $this->exam_type,
            'exam_date' => $this->exam_date->toDateString(),
            'score' => $this->score,
            'status' => $this->status,
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
