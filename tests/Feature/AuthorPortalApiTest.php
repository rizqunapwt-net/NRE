<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Contract;
use App\Models\ManuscriptProposal;
use App\Models\Marketplace;
use App\Models\Payment;
use App\Models\RoyaltyCalculation;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorPortalApiTest extends TestCase
{
    use RefreshDatabase;

    private function createVerifiedAuthorUser(): array
    {
        $user = User::factory()->create([
            'email' => 'author@example.com',
            'is_verified_author' => true,
        ]);

        $author = Author::factory()->create([
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => 'Author Example',
        ]);

        $user->update(['author_profile_id' => $author->id]);

        Sanctum::actingAs($user);

        return [$user, $author];
    }

    public function test_author_dashboard_returns_requested_author_metrics(): void
    {
        [$user, $author] = $this->createVerifiedAuthorUser();

        ManuscriptProposal::create([
            'author_id' => $author->id,
            'title' => 'Draft Book',
            'synopsis' => 'Draft synopsis',
            'genre' => 'Business',
            'status' => 'draft',
        ]);

        ManuscriptProposal::create([
            'author_id' => $author->id,
            'title' => 'Submitted Book',
            'synopsis' => 'Submitted synopsis',
            'genre' => 'Business',
            'status' => 'submitted',
        ]);

        $approved = ManuscriptProposal::create([
            'author_id' => $author->id,
            'title' => 'Approved Book',
            'synopsis' => 'Approved synopsis',
            'genre' => 'Business',
            'status' => 'accepted',
        ]);

        $published = ManuscriptProposal::create([
            'author_id' => $author->id,
            'title' => 'Published Book',
            'synopsis' => 'Published synopsis',
            'genre' => 'Business',
            'status' => 'accepted',
        ]);

        Book::create([
            'author_id' => $author->id,
            'manuscript_proposal_id' => $published->id,
            'title' => 'Published Book Output',
            'price' => 0,
            'status' => 'published',
            'is_published' => true,
        ]);

        $royalty = RoyaltyCalculation::create([
            'author_id' => $author->id,
            'period_month' => now()->format('Y-m'),
            'total_amount' => 1250.50,
            'status' => 'finalized',
        ]);

        Payment::create([
            'royalty_calculation_id' => $royalty->id,
            'invoice_number' => 'INV-AUTHOR-001',
            'amount' => 1250.50,
            'status' => 'paid',
        ]);

        $response = $this->getJson('/api/v1/author/dashboard');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Author dashboard retrieved successfully.')
            ->assertJsonPath('data.manuscripts.draft', 1)
            ->assertJsonPath('data.manuscripts.submitted', 1)
            ->assertJsonPath('data.manuscripts.approved', 1)
            ->assertJsonPath('data.manuscripts.published', 1)
            ->assertJsonPath('data.royalties.this_month', 1250.5)
            ->assertJsonCount(1, 'data.published_books');
    }

    public function test_author_can_create_list_and_view_manuscripts_with_consistent_response_shape(): void
    {
        Storage::fake('local');
        [, $author] = $this->createVerifiedAuthorUser();

        $createResponse = $this->post('/api/v1/author/manuscripts', [
            'title' => 'New Manuscript',
            'description' => 'Long form description',
            'category' => 'Technology',
            'file' => UploadedFile::fake()->create('manuscript.pdf', 1024, 'application/pdf'),
        ], [
            'Accept' => 'application/json',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.manuscript.title', 'New Manuscript')
            ->assertJsonPath('data.manuscript.category', 'Technology')
            ->assertJsonPath('data.manuscript.status', 'draft');

        $manuscriptId = $createResponse->json('data.manuscript.id');

        $this->assertDatabaseHas('manuscript_proposals', [
            'id' => $manuscriptId,
            'author_id' => $author->id,
            'title' => 'New Manuscript',
            'synopsis' => 'Long form description',
            'genre' => 'Technology',
            'status' => 'draft',
        ]);

        $listResponse = $this->getJson('/api/v1/author/manuscripts?status=draft');

        $listResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.id', $manuscriptId)
            ->assertJsonPath('data.items.0.status', 'draft')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'items',
                    'pagination',
                    'filters',
                ],
                'errors',
            ]);

        $detailResponse = $this->getJson("/api/v1/author/manuscripts/{$manuscriptId}");

        $detailResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.manuscript.id', $manuscriptId)
            ->assertJsonCount(2, 'data.timeline');
    }

    public function test_author_can_view_royalty_list_and_detail_breakdown(): void
    {
        [, $author] = $this->createVerifiedAuthorUser();

        $book = Book::create([
            'author_id' => $author->id,
            'title' => 'Royalty Book',
            'price' => 50000,
            'status' => 'draft',
        ]);

        Contract::create([
            'book_id' => $book->id,
            'contract_file_path' => 'contracts/royalty-book.pdf',
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'royalty_percentage' => 10,
            'status' => 'approved',
        ]);

        $marketplace = Marketplace::factory()->create();

        $periodOffset = 1;

        while (RoyaltyCalculation::where('author_id', $author->id)->where('period_month', now()->addMonths($periodOffset)->format('Y-m'))->exists()) {
            $periodOffset++;
        }

        $periodMonth = now()->addMonths($periodOffset)->format('Y-m');

        Sale::create([
            'marketplace_id' => $marketplace->id,
            'book_id' => $book->id,
            'transaction_id' => 'TRX-AUTHOR-001',
            'period_month' => $periodMonth,
            'quantity' => 3,
            'net_price' => 10000,
            'status' => 'completed',
        ]);

        $royalty = RoyaltyCalculation::where('author_id', $author->id)
            ->where('period_month', $periodMonth)
            ->firstOrFail();

        $royalty->update(['status' => 'paid']);

        Payment::create([
            'royalty_calculation_id' => $royalty->id,
            'invoice_number' => 'INV-AUTHOR-ROYALTY-001',
            'amount' => 3000,
            'status' => 'paid',
        ]);

        $listResponse = $this->getJson('/api/v1/author/royalties?status=paid');

        $listResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.id', $royalty->id)
            ->assertJsonPath('data.items.0.status', 'paid')
            ->assertJsonPath('data.grouped.0.period_month', $periodMonth);

        $detailResponse = $this->getJson("/api/v1/author/royalties/{$royalty->id}");

        $detailResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total_amount', 3000)
            ->assertJsonPath('data.breakdown.0.book.id', $book->id)
            ->assertJsonPath('data.breakdown.0.royalty_amount', 3000);
    }

    public function test_author_can_view_and_update_profile(): void
    {
        [$user, $author] = $this->createVerifiedAuthorUser();

        $response = $this->putJson('/api/v1/author/profile', [
            'name' => 'Updated Author',
            'email' => 'updated-author@example.com',
            'bio' => 'Updated bio',
            'bank_name' => 'BCA',
            'bank_account' => '1234567890',
            'bank_account_name' => 'Updated Author',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.profile.name', 'Updated Author')
            ->assertJsonPath('data.profile.email', 'updated-author@example.com')
            ->assertJsonPath('data.profile.bank_account.account_number', '1234567890');

        $this->assertDatabaseHas('authors', [
            'id' => $author->id,
            'name' => 'Updated Author',
            'email' => 'updated-author@example.com',
            'bank_name' => 'BCA',
            'bank_account' => '1234567890',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Author',
            'email' => 'updated-author@example.com',
        ]);

        $this->assertNull($user->fresh()->email_verified_at);
    }
}
