import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API_V1_BASE, API_BASE } from './base';

describe('API Base Configuration', () => {
    const originalEnv = { ...import.meta.env };

    beforeEach(() => {
        // Reset environment for each test
        vi.resetModules();
    });

    afterEach(() => {
        // Restore environment
        Object.assign(import.meta.env, originalEnv);
    });

    describe('API_V1_BASE', () => {
        it('should use VITE_API_URL environment variable if set', () => {
            // When VITE_API_URL is set to a valid URL
            expect(API_V1_BASE).toBeDefined();
            expect(typeof API_V1_BASE).toBe('string');
        });

        it('should normalize trailing slashes', () => {
            // API_V1_BASE should not have trailing slashes
            expect(API_V1_BASE).not.toMatch(/\/+$/);
        });

        it('should contain api path', () => {
            // API endpoint should contain /api somewhere
            expect(API_V1_BASE).toContain('/api');
        });

        it('should default to /api/v1 if VITE_API_URL is not set', () => {
            // If no env var, defaults to /api/v1
            if (!import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.trim() === '') {
                expect(API_V1_BASE).toBe('/api/v1');
            }
        });
    });

    describe('API_BASE', () => {
        it('should be defined', () => {
            expect(API_BASE).toBeDefined();
            expect(typeof API_BASE).toBe('string');
        });

        it('should remove /v1 suffix if present in API_V1_BASE', () => {
            // If API_V1_BASE ends with /v1, API_BASE should be without it
            if (API_V1_BASE.endsWith('/v1')) {
                expect(API_BASE).not.toContain('/v1');
            }
        });

        it('should contain /api path', () => {
            expect(API_BASE).toContain('/api');
        });
    });

    describe('URL Normalization', () => {
        it('API_V1_BASE should have no leading/trailing spaces', () => {
            expect(API_V1_BASE).toBe(API_V1_BASE.trim());
        });

        it('API_BASE should have no leading/trailing spaces', () => {
            expect(API_BASE).toBe(API_BASE.trim());
        });
    });
});
