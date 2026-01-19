<?php

namespace App\Repositories\Eloquent;

use App\Models\Attendance;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use App\Repositories\Interfaces\AttendanceRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AttendanceRepo implements AttendanceRepoInterf
{
  public function paginate(array $params = []): LengthAwarePaginator
  {
    $perPage = (int) ($params['per_page'] ?? 15);
    $perPage = max(1, min($perPage, 100));

    $query = Attendance::query();

    $trashed = $params['trashed'] ?? 'none';
    switch ($trashed) {
      case 'with':
        $query->withTrashed();
        break;
      case 'only':
        $query->onlyTrashed();
        break;
      case 'none':
      default:
        break;
    }

    return QueryBuilder::for($query)
      ->allowedFilters([
        AllowedFilter::exact('student_id'),
        AllowedFilter::exact('class_id'),
        AllowedFilter::exact('status'),
        AllowedFilter::exact('date'),
      ])
      ->allowedSorts(['id','date','created_at'])
      ->defaultSort('id')
      ->paginate($perPage);
  }

  public function findById(int $id): ?Attendance
  {
    return Attendance::withTrashed()->find($id);
  }

  public function create(array $data): Attendance
  {
    return Attendance::create($data);
  }

  public function update(Attendance $attendance, array $data): Attendance
  {
    $attendance->update($data);
    return $attendance;
  }

  public function delete(Attendance $attendance): void
  {
    $attendance->delete();
  }

  public function restore(int $id): ?Attendance
  {
    $attendance = Attendance::onlyTrashed()->findOrFail($id);
    $attendance->restore();
    return $attendance;
  }

  public function forceDelete(int $id): void
  {
    $attendance = Attendance::onlyTrashed()->findOrFail($id);
    $attendance->forceDelete();
  }

}
