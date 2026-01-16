<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;


class UserImport implements 
    ToModel,
    WithHeadingRow,
    WithValidation,
    WithChunkReading,
    WithBatchInserts,
    ShouldQueue,
    SkipsOnFailure
{
    use SkipsFailures;

    public function uniqueBy(): array
    {
        return ['email'];
    }
    /**
     * Expected headings: name, email, password (plain), telegram_chat_id, avatar, phone
     * You can adapt to your sheet structure.
     */
    public function model(array $row)
    {
        // Normalize and sanitize incoming row values
        $name = isset($row['name']) ? trim($row['name']) : 'Unknown';
        $email = isset($row['email']) ? strtolower(trim($row['email'])) : null;
        $password = isset($row['password']) ? Hash::make($row['password']) : Hash::make('secretpassword');

        // Normalize gender to 'male' | 'female' or null to satisfy DB CHECK constraint
        $rawGender = isset($row['gender']) ? strtolower(trim((string) $row['gender'])) : null;
        $gender = null;
        if (in_array($rawGender, ['male', 'm', 'man'], true)) {
            $gender = 'male';
        } elseif (in_array($rawGender, ['female', 'f', 'woman'], true)) {
            $gender = 'female';
        }

        // Parse dates safely (support 'dob' or 'date_of_birth')
        $dob = null;
        $dobSource = $row['dob'] ?? $row['date_of_birth'] ?? null;
        if (!empty($dobSource)) {
            try {
                $dob = Carbon::parse($dobSource)->toDateString();
            } catch (\Exception $e) {
                $dob = null;
            }
        }

        $createdAt = null;
        if (!empty($row['created_at'])) {
            try {
                $createdAt = Carbon::parse($row['created_at'])->toDateTimeString();
            } catch (\Exception $e) {
                $createdAt = null;
            }
        }

        $updatedAt = null;
        if (!empty($row['updated_at'])) {
            try {
                $updatedAt = Carbon::parse($row['updated_at'])->toDateTimeString();
            } catch (\Exception $e) {
                $updatedAt = null;
            }
        }

        $deletedAt = null;
        if (!empty($row['deleted_at'])) {
            try {
                $deletedAt = Carbon::parse($row['deleted_at'])->toDateTimeString();
            } catch (\Exception $e) {
                $deletedAt = null;
            }
        }

        $phone = isset($row['phone']) ? trim($row['phone']) : null;
        $telegram = isset($row['telegram_chat_id']) ? trim($row['telegram_chat_id']) : null;
        $avatar = isset($row['avatar']) && filter_var($row['avatar'], FILTER_VALIDATE_URL) ? trim($row['avatar']) : null;

        $position = isset($row['position']) ? trim($row['position']) : null;
        $address = isset($row['address']) ? trim($row['address']) : null;
        $classId = isset($row['class_id']) && $row['class_id'] !== '' ? (int) $row['class_id'] : null;
        $parentId = isset($row['parent_id']) && $row['parent_id'] !== '' ? (int) $row['parent_id'] : null;

        // Validate foreign keys exist; if not, set to null to avoid FK constraint failures
        if ($classId !== null) {
            try {
                $classExists = DB::table('classes')->where('id', $classId)->exists();
                if (! $classExists) {
                    $classId = null;
                }
            } catch (\Exception $e) {
                // If the classes table doesn't exist or query fails, null the value
                $classId = null;
            }
        }

        if ($parentId !== null) {
            try {
                $parentExists = User::where('id', $parentId)->exists();
                if (! $parentExists) {
                    $parentId = null;
                }
            } catch (\Exception $e) {
                $parentId = null;
            }
        }
        $rememberToken = isset($row['remember_token']) ? trim($row['remember_token']) : null;

        return new User([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'gender' => $gender,
            'dob' => $dob,
            'phone' => $phone,
            'telegram_chat_id' => $telegram,
            'avatar' => $avatar,
            'position' => $position,
            'address' => $address,
            'class_id' => $classId,
            'parent_id' => $parentId,
            'remember_token' => $rememberToken,
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
            'deleted_at' => $deletedAt,
        ]);
    }
        
    public function rules(): array
    {
        return [
            '*.name'              => ['required', 'string', 'max:255'],
            '*.email'             => ['required', 'email:rfc', 'max:255'],
            '*.password'          => ['nullable', 'string', 'min:8', 'max:64'],
            '*.gender'            => ['nullable', 'in:male,female'],
            '*.dob'               => ['nullable', 'date'],
            '*.date_of_birth'     => ['nullable', 'date'],
            '*.phone'             => ['nullable', 'string', 'max:32'],
            '*.telegram_chat_id'  => ['nullable', 'string', 'max:64'],
            '*.avatar'            => ['nullable', 'url', 'max:1024'],
            '*.position'          => ['nullable', 'string', 'max:50'],
            '*.address'           => ['nullable', 'string', 'max:255'],
            '*.class_id'          => ['nullable', 'integer'],
            '*.parent_id'         => ['nullable', 'integer'],
            '*.remember_token'    => ['nullable', 'string', 'max:100'],
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
