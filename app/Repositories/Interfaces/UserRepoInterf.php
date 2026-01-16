<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\User;

interface UserRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?User;
  public function create(array $data): User;
  public function update(User $user, array $data): User;
  public function delete(User $user): void;
  public function restore(int $id): ?User;
  public function forceDelete(int $id): void;
}
