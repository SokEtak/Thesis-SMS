<?php

namespace App\Imports;

use App\Models\Message;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class MessageImport implements 
    ToModel,
    WithHeadingRow,
    WithChunkReading,
    WithBatchInserts,
    ShouldQueue,
    SkipsOnFailure
{
    use SkipsFailures;

    public function model(array $row)
    {
        return new Message([
            'sender_id' => isset($row['sender_id']) && $row['sender_id'] !== '' ? (int) $row['sender_id'] : null,
            'receiver_id' => isset($row['receiver_id']) && $row['receiver_id'] !== '' ? (int) $row['receiver_id'] : null,
            'message_body' => $row['message_body'] ?? null,
            'is_read' => isset($row['is_read']) ? (bool) $row['is_read'] : false,
        ]);
    }

    public function chunkSize(): int
    {
        return 10000;
    }

    public function batchSize(): int
    {
        return 10000;
    }
}
