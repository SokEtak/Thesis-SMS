<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Scout\Searchable;

class Subject extends Model
{
    use HasFactory, Notifiable, Searchable,SoftDeletes;

    protected $fillable = [
        'code',
        'name',
    ];

    // protected $guarded = [];

    // relationships

    public function timetables()
    {
        return $this->hasMany(Timetable::class, 'subject_id');
    }

    public function homeworks()
    {
        return $this->hasMany(Homework::class, 'subject_id');
    }

    public function toSearchableArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
        ];
    }
}
