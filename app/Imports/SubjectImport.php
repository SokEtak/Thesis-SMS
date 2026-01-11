<?php

namespace App\Imports;

use App\Models\Subject;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;

class SubjectImport implements
    ToModel,
    WithHeadingRow,
    WithValidation,
    WithChunkReading,
    WithBatchInserts,
    ShouldQueue
{
    public function model(array $row)
    {
        // Normalize header keys to handle variations (BOM, capitalization)
        $normalized = [];
        foreach ($row as $key => $value) {
            $cleanKey = preg_replace('/^\x{FEFF}/u', '', $key); // strip BOM
            $cleanKey = trim($cleanKey);
            $normalized[strtolower($cleanKey)] = $value;
        }

        if (empty($normalized['code']) || empty($normalized['name'])) {
            return null; // skip invalid/empty rows
        }

        return new Subject([
            'code' => $normalized['code'],
            'name' => $normalized['name'],
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
