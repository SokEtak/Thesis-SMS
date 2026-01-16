<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Models\Classroom;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;



class ClassroomImport implements
    ToModel,
    WithHeadingRow,
    WithValidation,
    WithChunkReading,
    WithBatchInserts,
    ShouldQueue,
    SkipsOnFailure
{
    use SkipsFailures;

    public function model(array $row)
    {
            return new Classroom([
                "name" => $row['name']??null,
                "teacher_in_charge_id" => $row['teacher_in_charge_id']??null,
            ]);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'teacher_in_charge_id' => 'nullable|exists:users,id',
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
