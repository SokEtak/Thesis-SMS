<?php

namespace App\Repositories\Interfaces;

use App\Models\ExamResult;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ExamResultRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator;

    public function findById(int $id): ?ExamResult;

    public function create(array $data): ExamResult;

    public function update(ExamResult $model, array $data): ExamResult;

    public function delete(ExamResult $model): void;

    public function restore(int $id): ?ExamResult;

    public function forceDelete(int $id): void;
}
