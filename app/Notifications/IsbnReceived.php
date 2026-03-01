<?php

namespace App\Notifications;

use App\Models\IsbnRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class IsbnReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public IsbnRequest $isbnRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('ISBN Received - '.$this->isbnRequest->book_title)
            ->greeting('Hello,')
            ->line('Great news! The ISBN for your book has been received.')
            ->line("Book Title: {$this->isbnRequest->book_title}")
            ->line("ISBN: {$this->isbnRequest->isbn_number}")
            ->line('The barcode has been generated and is ready for use.')
            ->action('View ISBN Details', url('/admin/isbn-requests/'.$this->isbnRequest->id))
            ->line('Congratulations on this milestone!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'isbn_request_id' => $this->isbnRequest->id,
            'book_title' => $this->isbnRequest->book_title,
            'isbn_number' => $this->isbnRequest->isbn_number,
            'message' => 'ISBN has been received and is ready for use',
        ];
    }
}
