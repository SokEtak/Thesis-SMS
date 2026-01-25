<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface GlobalRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator;

    public function findById(int $id);

    public function create(array $data);

    public function update($model, array $data);

    public function delete($model): void;

    public function restore(int $id);

    public function forceDelete(int $id): void;
}
