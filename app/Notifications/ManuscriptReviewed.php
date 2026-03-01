<?php

namespace App\Notifications;

use App\Models\ManuscriptProposal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ManuscriptReviewed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ManuscriptProposal $proposal,
        public string $decision,
        public ?string $notes = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $statusLabel = match ($this->decision) {
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'revised' => 'Needs Revision',
            default => 'Updated',
        };

        return (new MailMessage)
            ->subject('Manuscript Review Decision - '.$this->proposal->title)
            ->greeting('Dear Author,')
            ->line("Your manuscript \"{$this->proposal->title}\" has been reviewed.")
            ->line("Decision: {$statusLabel}")
            ->when($this->notes, function ($mail) {
                return $mail->line("Editorial Notes: {$this->notes}");
            })
            ->action('View Manuscript', url('/admin/manuscript-proposals/'.$this->proposal->id))
            ->line('Thank you for submitting your work to us.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'proposal_id' => $this->proposal->id,
            'proposal_title' => $this->proposal->title,
            'decision' => $this->decision,
            'notes' => $this->notes,
        ];
    }
}
