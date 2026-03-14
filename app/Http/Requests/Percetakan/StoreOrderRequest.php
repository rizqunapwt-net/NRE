<?php

namespace App\Http\Requests\Percetakan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Add proper authorization later
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Customer
            'customer_id' => ['required', 'exists:percetakan_customers,id'],

            // Product
            'product_id' => ['required', 'exists:percetakan_products,id'],

            // Order details
            'quantity' => ['required', 'integer', 'min:1'],
            'deadline' => ['nullable', 'date', 'after:today'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'is_rush_order' => ['boolean'],

            // Specifications (required for printing orders)
            'specifications' => ['required', 'array'],
            'specifications.size' => ['required', 'string'],
            'specifications.paper_type' => ['required', 'string'],
            'specifications.paper_weight' => ['required', 'string'],
            'specifications.colors_inside' => ['required', 'string'],
            'specifications.colors_outside' => ['required', 'string'],
            'specifications.binding_type' => ['nullable', 'string'],
            'specifications.finishing' => ['nullable', 'string'],
            'specifications.pages_count' => ['nullable', 'integer', 'min:1'],

            // Pricing
            'unit_price' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],

            // Payment terms
            'deposit_percentage' => ['nullable', 'numeric', 'between:0,100'],

            // Notes
            'production_notes' => ['nullable', 'string'],
            'customer_notes' => ['nullable', 'string'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'customer_id' => [
                'description' => 'ID customer percetakan.',
                'example' => 1,
            ],
            'product_id' => [
                'description' => 'ID produk percetakan yang dipesan.',
                'example' => 1,
            ],
            'quantity' => [
                'description' => 'Jumlah unit yang dipesan.',
                'example' => 1000,
            ],
            'deadline' => [
                'description' => 'Tanggal deadline produksi.',
                'example' => now()->addWeek()->toDateString(),
            ],
            'priority' => [
                'description' => 'Prioritas pengerjaan.',
                'example' => 'high',
            ],
            'is_rush_order' => [
                'description' => 'Apakah order termasuk rush order.',
                'example' => false,
            ],
            'unit_price' => [
                'description' => 'Harga satuan per unit.',
                'example' => 15000,
            ],
            'discount_amount' => [
                'description' => 'Nominal diskon order.',
                'example' => 50000,
            ],
            'deposit_percentage' => [
                'description' => 'Persentase DP order.',
                'example' => 50,
            ],
            'production_notes' => [
                'description' => 'Catatan internal untuk produksi.',
                'example' => 'Prioritaskan finishing glossy.',
            ],
            'customer_notes' => [
                'description' => 'Catatan dari customer.',
                'example' => 'Kirim sebelum akhir bulan.',
            ],
            'specifications' => [
                'description' => 'Objek spesifikasi cetak.',
                'example' => [
                    'size' => 'A4',
                    'paper_type' => 'Art Paper',
                    'paper_weight' => '150 gsm',
                    'colors_inside' => '4/4',
                    'colors_outside' => '4/4',
                    'binding_type' => 'perfect binding',
                    'finishing' => 'glossy lamination',
                    'pages_count' => 120,
                ],
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'customer_id.required' => 'Customer harus dipilih',
            'customer_id.exists' => 'Customer tidak ditemukan',
            'product_id.required' => 'Produk harus dipilih',
            'quantity.required' => 'Jumlah order harus diisi',
            'quantity.min' => 'Jumlah order minimal 1',
            'deadline.after' => 'Deadline harus di masa depan',
            'specifications.required' => 'Spesifikasi cetak harus diisi',
            'specifications.size.required' => 'Ukuran kertas harus diisi',
            'specifications.paper_type.required' => 'Jenis kertas harus diisi',
            'specifications.paper_weight.required' => 'Berat kertas harus diisi',
            'unit_price.required' => 'Harga satuan harus diisi',
        ];
    }
}
