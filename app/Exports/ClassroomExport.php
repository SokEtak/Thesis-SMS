<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ClassroomExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Teacher In Charge ID',
        ];
    }
    public function collection(): Collection
    {

        return User::query()
            ->select([
                'id',
                'name',
                'teacher_in_charge_id',
                
            ])
            ->orderBy('id')
            ->get();
    }
}