<?php

namespace App\Repositories\Eloquent;

use App\Models\Message;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use App\Repositories\Interfaces\MessageRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MessageRepo implements MessageRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Message::query();

        $trashed = $params['trashed'] ?? 'none';
        switch ($trashed) {
            case 'with':
                $query->withTrashed();
                break;
            case 'only':
                $query->onlyTrashed();
                break;
            case 'none':
            default:
                break;
        }

        return QueryBuilder::for($query)
            ->allowedFilters([
                AllowedFilter::exact('sender_id'),
                AllowedFilter::exact('receiver_id'),
                AllowedFilter::exact('is_read'),
            ])
            ->allowedSorts(['id','created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?Message
    {
        return Message::withTrashed()->find($id);
    }

    public function create(array $data): Message
    {
        return Message::create($data);
    }

    public function update(Message $model, array $data): Message
    {
        $model->update($data);
        return $model;
    }

    public function delete(Message $model): void
    {
        $model->delete();
    }

    public function restore(int $id): ?Message
    {
        $model = Message::onlyTrashed()->findOrFail($id);
        $model->restore();
        return $model;
    }

    public function forceDelete(int $id): void
    {
        $model = Message::onlyTrashed()->findOrFail($id);
        $model->forceDelete();
    }
}
