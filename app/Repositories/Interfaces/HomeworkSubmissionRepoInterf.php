<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\HomeworkSubmission;

interface HomeworkSubmissionRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?HomeworkSubmission;
  public function create(array $data): HomeworkSubmission;
  public function update(HomeworkSubmission $model, array $data): HomeworkSubmission;
  public function delete(HomeworkSubmission $model): void;
  public function restore(int $id): ?HomeworkSubmission;
  public function forceDelete(int $id): void;
}
