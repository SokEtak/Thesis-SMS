<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Homework extends Model
{
    /** @use HasFactory<\\Database\\Factories\\HomeworkFactory> */
    use HasFactory, Searchable, SoftDeletes,logsActivity;

    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'title',
        'description',
        'file_url',
        'deadline',
    ];

    protected $casts = [
    ];

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'deadline' => $this->deadline,
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

    //relations
    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

}