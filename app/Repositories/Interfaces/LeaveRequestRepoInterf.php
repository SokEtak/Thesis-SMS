<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\LeaveRequest;

interface LeaveRequestRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?LeaveRequest;
  public function create(array $data): LeaveRequest;
  public function update(LeaveRequest $model, array $data): LeaveRequest;
  public function delete(LeaveRequest $model): void;
  public function restore(int $id): ?LeaveRequest;
  public function forceDelete(int $id): void;
}
