<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Scout\Searchable;
use Illuminate\Notifications\Notifiable;

class Subject extends Model
{
  use HasFactory, SoftDeletes, Searchable,Notifiable;

  protected $fillable = [
    'code',
    'name',
  ];

  // protected $guarded = [];

  //relationships

  public function timetables()
  {
    return $this->hasMany(Timetable::class, 'subject_id');
  }
  
  public function toSearchableArray(): array
  {
    return [
      'code' => $this->code,
      'name' => $this->name,
    ];
  }
}