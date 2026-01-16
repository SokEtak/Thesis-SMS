<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Classroom;

interface ClassroomRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?Classroom;
  public function create(array $data): Classroom;
  public function update(Classroom $classroom, array $data): Classroom;
  public function delete(Classroom $classroom): void;
  public function restore(int $id): ?Classroom;
  public function forceDelete(int $id): void;
}
