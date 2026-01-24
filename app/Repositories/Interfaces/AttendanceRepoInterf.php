<?php

namespace App\Repositories\Interfaces;

use App\Models\Attendance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AttendanceRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator;

    public function findById(int $id): ?Attendance;

    public function create(array $data): Attendance;

    public function update(Attendance $attendance, array $data): Attendance;

    public function delete(Attendance $attendance): void;

    public function restore(int $id): ?Attendance;

    public function forceDelete(int $id): void;
}
