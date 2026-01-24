<?php

namespace App\Repositories\Interfaces;

use App\Models\HomeworkSubmission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface HomeworkSubmissionRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator;

    public function findById(int $id): ?HomeworkSubmission;

    public function create(array $data): HomeworkSubmission;

    public function update(HomeworkSubmission $model, array $data): HomeworkSubmission;

    public function delete(HomeworkSubmission $model): void;

    public function restore(int $id): ?HomeworkSubmission;

    public function forceDelete(int $id): void;
}
