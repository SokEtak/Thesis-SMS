<?php
namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Subject;

interface SubjectRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?Subject;
  public function create(array $data): Subject;
  public function update(Subject $subject, array $data): Subject;
  public function delete(Subject $subject): void;
  public function restore(int $id): ?Subject;
  public function forceDelete(int $id): void;
}
