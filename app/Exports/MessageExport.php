<?php

namespace App\Exports;

use App\Models\Message;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class MessageExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID', 'Sender ID', 'Receiver ID', 'Message Body', 'Is Read', 'Created At', 'Updated At', 'Deleted At'
        ];
    }

    public function collection(): Collection
    {
        return Message::query()
            ->select(['id','sender_id','receiver_id','message_body','is_read','created_at','updated_at','deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
