<?php

namespace App\Exports;

use App\Models\Subject;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\Exportable;

class SubjectExport implements FromQuery, WithHeadings
{
  use Exportable;

  public function collection()
  {
    return Subject::all(['code', 'name', 'created_at', 'updated_at', 'deleted_at']);
  }

  public function query()
  {
    return Subject::query()->select('code', 'name', 'created_at', 'updated_at', 'deleted_at');
  }
  public function headings(): array
  {
    return ['Code', 'Name', 'created_at', 'updated_at', 'deleted_at'];
  }
}
