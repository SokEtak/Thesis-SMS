<?php

namespace App\Repositories\Eloquent;

use App\Models\Message;
use App\Repositories\Interfaces\MessageRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MessageRepo implements MessageRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Message::query()->with([
            'sender:id,name',
            'receiver:id,name',
        ]);

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
                AllowedFilter::callback('q', function (Builder $query, mixed $value): void {
                    $term = trim((string) $value);
                    if ($term === '') {
                        return;
                    }

                    $query->where(function (Builder $builder) use ($term): void {
                        $this->applyCaseInsensitiveContains($builder, 'message_body', $term);
                        $builder->orWhereHas('sender', function (Builder $senderQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($senderQuery, 'name', $term);
                        });
                        $builder->orWhereHas('receiver', function (Builder $receiverQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($receiverQuery, 'name', $term);
                        });
                    });
                }),
                AllowedFilter::exact('sender_id'),
                AllowedFilter::exact('receiver_id'),
                AllowedFilter::exact('is_read'),
            ])
            ->allowedSorts(['id', 'is_read', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    private function applyCaseInsensitiveContains(Builder $query, string $column, string $term): void
    {
        $driver = $query->getConnection()->getDriverName();
        $wrappedColumn = $query->getQuery()->getGrammar()->wrap($column);
        $normalized = Str::lower($term);

        if (in_array($driver, ['mysql', 'mariadb', 'sqlite'], true)) {
            $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.$normalized.'%']);

            return;
        }

        if ($driver === 'pgsql') {
            $query->where($column, 'ilike', '%'.$term.'%');

            return;
        }

        $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.$normalized.'%']);
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
