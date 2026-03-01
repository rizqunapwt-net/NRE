<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_application_returns_a_successful_response(): void
    {
        // Root URL serves the React SPA or returns SPA fallback message
        $response = $this->get('/');

        // Either successful SPA response (200) or build required message (500)
        $response->assertStatus(200);
    }
}
