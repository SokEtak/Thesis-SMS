<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class HomeworkSubmission extends Model
{
    /** @use HasFactory<\Database\Factories\HomeworkSubmissionFactory> */
    use HasFactory,SoftDeletes,LogsActivity,Searchable;

    protected $fillable = [
        'homework_id',
        'student_id',
        'file_url',
        'submitted_at',
        'score',
        'feedback',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'score' => 'integer',
    ];

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'file_url' => $this->file_url,
            'submitted_at' => $this->submitted_at,
            'score' => $this->score,
            'feedback' => $this->feedback,
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable() // log only attributes in $fillable
            ->logOnlyDirty() // only log changed attributes
            ->useLogName('users') // sets log_name column
            ->setDescriptionForEvent(function (string $eventName) {
                return "User model has been {$eventName}";
            });
    }

    // relations
    public function homework()
    {
        return $this->belongsTo(Homework::class, 'homework_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
