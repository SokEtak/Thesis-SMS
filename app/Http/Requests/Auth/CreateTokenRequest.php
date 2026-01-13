<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class CreateTokenRequest extends FormRequest {
  public function authorize(): bool { return true; }
  public function rules(): array {
    return [
      'name' => ['required','string','max:60'],//device-name
      'abilities' => ['array'], //Permission for user ['subjects.view-any','exams.manage',...]
    ];
  }
}

