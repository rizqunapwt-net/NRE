<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('Admin') ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
