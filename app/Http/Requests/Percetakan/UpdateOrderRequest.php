<?php

namespace App\Http\Requests\Percetakan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'exists:percetakan_customers,id'],
            'product_id' => ['sometimes', 'exists:percetakan_products,id'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['inquiry', 'quoted', 'confirmed', 'in_production', 'completed', 'ready_delivery', 'delivered', 'cancelled'])],
            'deadline' => ['nullable', 'date'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'is_rush_order' => ['boolean'],
            'specifications' => ['sometimes', 'array'],
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'deposit_percentage' => ['nullable', 'numeric', 'between:0,100'],
            'deposit_paid' => ['nullable', 'numeric', 'min:0'],
            'production_notes' => ['nullable', 'string'],
            'customer_notes' => ['nullable', 'string'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'customer_id' => [
                'description' => 'ID customer baru jika order dipindahkan.',
                'example' => 2,
            ],
            'product_id' => [
                'description' => 'ID produk percetakan baru.',
                'example' => 3,
            ],
            'quantity' => [
                'description' => 'Jumlah unit yang diperbarui.',
                'example' => 1500,
            ],
            'status' => [
                'description' => 'Status order percetakan.',
                'example' => 'confirmed',
            ],
            'deadline' => [
                'description' => 'Deadline produksi yang baru.',
                'example' => now()->addDays(10)->toDateString(),
            ],
            'priority' => [
                'description' => 'Prioritas produksi.',
                'example' => 'urgent',
            ],
            'unit_price' => [
                'description' => 'Harga satuan baru.',
                'example' => 17500,
            ],
            'discount_amount' => [
                'description' => 'Nominal diskon baru.',
                'example' => 75000,
            ],
            'deposit_percentage' => [
                'description' => 'Persentase DP baru.',
                'example' => 60,
            ],
            'specifications' => [
                'description' => 'Objek spesifikasi cetak yang diperbarui.',
                'example' => [
                    'size' => 'B5',
                    'paper_type' => 'HVS',
                    'paper_weight' => '80 gsm',
                    'colors_inside' => '1/1',
                    'colors_outside' => '4/4',
                    'binding_type' => 'staple',
                    'finishing' => 'none',
                    'pages_count' => 64,
                ],
            ],
            'production_notes' => [
                'description' => 'Catatan internal produksi.',
                'example' => 'Ubah jadwal mesin ke batch malam.',
            ],
            'customer_notes' => [
                'description' => 'Catatan customer terbaru.',
                'example' => 'Tambahkan packing kardus tebal.',
            ],
        ];
    }
}
