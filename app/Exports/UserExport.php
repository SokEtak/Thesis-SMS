<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class UserExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Email',
            'Gender',
            'Date of Birth',
            'Phone',
            'Telegram Chat ID',
            'Avatar',
            'Position',
            'Address',
            'Class ID',
            'Parent ID',
            'Remember Token',
            'Created At',
            'Updated At',
            'Deleted At',
        ];
    }
    public function collection(): Collection
    {
        // Do NOT export sensitive fields (password, remember_token)
        return User::query()
            ->select([
                'id',
                'name',
                'email',
                'gender',
                'dob',
                'phone',
                'telegram_chat_id',
                'avatar',
                'position',
                'address',
                'class_id',
                'parent_id',
                'remember_token',
                'created_at',
                'updated_at',
                'deleted_at',
            ])
            ->orderBy('id')
            ->get();
    }
}