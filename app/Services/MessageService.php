<?php

namespace App\Services;

use App\Exports\MessageExport;
use App\Imports\MessageImport;
use App\Models\Message;
use App\Repositories\Interfaces\MessageRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MessageService
{
    public function __construct(private MessageRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(Message $model): Message
    {
        return $model;
    }

    public function store(array $data): Message
    {
        return DB::transaction(function () use ($data) {
            return $this->repo->create($data);
        });
    }

    public function update(Message $model, array $data): Message
    {
        return DB::transaction(function () use ($model, $data) {
            return $this->repo->update($model, $data);
        });
    }

    public function delete(Message $model): void
    {
        $this->repo->delete($model);
    }

    public function findTrashed(int $id): Message
    {
        return Message::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?Message
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new MessageImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new MessageExport, 'messages.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
