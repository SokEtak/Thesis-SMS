<?php

namespace App\Imports;

use App\Models\Subject;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class SubjectImport implements ShouldQueue, ToModel, WithBatchInserts, WithChunkReading, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return new Subject([
            'code' => $row['code'],
            'name' => $row['name'],
            // 'created_at' => $row['created_at'] ?? now(),
            // 'updated_at' => $row['updated_at'] ?? now(),
            // 'deleted_at' => $row['deleted_at'] ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            '*.code' => ['required', 'string'],
            '*.name' => ['required', 'string'],
        ];
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
