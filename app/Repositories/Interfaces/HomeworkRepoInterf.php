<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Homework;

interface HomeworkRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?Homework;
  public function create(array $data): Homework;
  public function update(Homework $model, array $data): Homework;
  public function delete(Homework $model): void;
  public function restore(int $id): ?Homework;
  public function forceDelete(int $id): void;
}
