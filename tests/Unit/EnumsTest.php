<?php

namespace Tests\Unit;

use App\Enums\BookStatus;
use App\Enums\RoyaltyStatus;
use App\Enums\SaleStatus;
use PHPUnit\Framework\TestCase;

class EnumsTest extends TestCase
{
    public function test_book_status_enum_has_all_required_values(): void
    {
        $this->assertTrue(defined('App\Enums\BookStatus::DRAFT'));
        $this->assertTrue(defined('App\Enums\BookStatus::PUBLISHED'));
        $this->assertTrue(defined('App\Enums\BookStatus::ARCHIVED'));
    }

    public function test_book_status_draft_is_correct(): void
    {
        $status = BookStatus::DRAFT;
        $this->assertNotNull($status);
    }

    public function test_book_status_published_is_correct(): void
    {
        $status = BookStatus::PUBLISHED;
        $this->assertNotNull($status);
    }

    public function test_royalty_status_has_all_required_values(): void
    {
        $this->assertTrue(defined('App\Enums\RoyaltyStatus::Draft'));
        $this->assertTrue(defined('App\Enums\RoyaltyStatus::Finalized'));
    }

    public function test_sale_status_has_all_required_values(): void
    {
        $this->assertTrue(defined('App\Enums\SaleStatus::Completed'));
        $this->assertTrue(defined('App\Enums\SaleStatus::Refunded'));
    }

    public function test_book_status_enum_can_be_converted_to_string(): void
    {
        $status = BookStatus::DRAFT;
        $this->assertIsString($status->value);
    }

    public function test_royalty_status_enum_can_be_converted_to_string(): void
    {
        $status = RoyaltyStatus::Draft;
        $this->assertIsString($status->value);
    }

    public function test_sale_status_enum_can_be_compared(): void
    {
        $status1 = SaleStatus::Completed;
        $status2 = SaleStatus::Completed;

        $this->assertEquals($status1, $status2);
    }

    public function test_sale_status_enum_can_be_differentiated(): void
    {
        $status1 = SaleStatus::Completed;
        $status2 = SaleStatus::Refunded;

        $this->assertNotEquals($status1, $status2);
    }

    public function test_book_status_can_transition(): void
    {
        $draftStatus = BookStatus::DRAFT;
        $publishedStatus = BookStatus::PUBLISHED;

        // Status should be different
        $this->assertNotEquals($draftStatus, $publishedStatus);
    }

    public function test_royalty_status_can_transition(): void
    {
        $draftStatus = RoyaltyStatus::Draft;
        $finalizedStatus = RoyaltyStatus::Finalized;

        // Status should be different
        $this->assertNotEquals($draftStatus, $finalizedStatus);
    }
}
