<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExamResult extends Model
{
    use HasFactory, Searchable, SoftDeletes;

    protected $fillable = [
        'student_id',
        'subject_id',
        'exam_type',
        'score',
        'month_year',
    ];

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'subject_id' => $this->subject_id,
            'exam_type' => $this->exam_type,
            'score' => $this->score,
            'month_year' => $this->month_year,
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
