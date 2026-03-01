<?php

namespace Tests\Unit;

use App\Models\Percetakan\ProductionJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_efficiency_with_zero_waste(): void
    {
        $job = new ProductionJob();
        $job->quantity_good = 100;
        $job->quantity_waste = 0;

        $this->assertEquals(100.0, $job->efficiency);
    }

    public function test_efficiency_with_normal_values(): void
    {
        $job = new ProductionJob();
        $job->quantity_good = 90;
        $job->quantity_waste = 10;

        $this->assertEquals(90.0, $job->efficiency);
    }

    public function test_efficiency_with_null_values(): void
    {
        $job = new ProductionJob();
        $job->quantity_good = null;
        $job->quantity_waste = null;

        $this->assertNull($job->efficiency);
    }

    public function test_efficiency_with_zero_good_some_waste(): void
    {
        $job = new ProductionJob();
        $job->quantity_good = 0;
        $job->quantity_waste = 10;

        $this->assertEquals(0.0, $job->efficiency);
    }
}
