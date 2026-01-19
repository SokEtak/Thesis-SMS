<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Message;

interface MessageRepoInterf {
  public function paginate(array $params = []): LengthAwarePaginator;
  public function findById(int $id): ?Message;
  public function create(array $data): Message;
  public function update(Message $model, array $data): Message;
  public function delete(Message $model): void;
  public function restore(int $id): ?Message;
  public function forceDelete(int $id): void;
}
