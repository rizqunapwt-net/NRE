<?php

namespace App\Notifications;

use App\Models\Percetakan\Material;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StockLow extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Material $material,
        public float $currentStock,
        public float $minStock
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $shortage = $this->minStock - $this->currentStock;

        return (new MailMessage)
            ->subject('Low Stock Alert - '.$this->material->name)
            ->greeting('Warehouse Manager,')
            ->error()
            ->line("Material \"{$this->material->name}\" is running low on stock.")
            ->line("Current Stock: {$this->currentStock} {$this->material->unit}")
            ->line("Minimum Stock: {$this->minStock} {$this->material->unit}")
            ->line("Shortage: {$shortage} {$this->material->unit}")
            ->action('View Material', url('/admin/percetakan-materials/'.$this->material->id))
            ->line('Please consider placing a purchase order soon.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'material_id' => $this->material->id,
            'material_name' => $this->material->name,
            'material_code' => $this->material->code,
            'current_stock' => $this->currentStock,
            'min_stock' => $this->minStock,
            'message' => 'Stock is below minimum level',
        ];
    }
}
