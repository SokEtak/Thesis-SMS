<?php

namespace App\Repositories\Interfaces;

use App\Models\Timetable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TimetableRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator;

    public function findById(int $id): ?Timetable;

    public function create(array $data): Timetable;

    public function update(Timetable $model, array $data): Timetable;

    public function delete(Timetable $model): void;

    public function restore(int $id): ?Timetable;

    public function forceDelete(int $id): void;
}
