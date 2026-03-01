/**
 * API Error Handler Utility
 * Centralized error handling for API responses
 */

interface ApiErrorResponse {
    message?: string;
    error?: string | { message?: string };
    errors?: Record<string, string[]>;
}

interface AxiosErrorLike {
    response?: {
        data?: ApiErrorResponse;
        status?: number;
    };
    message?: string;
}

/**
 * Extract error message from API error response
 * Handles various API error response shapes
 */
export const getErrorMessage = (error: unknown, defaultMessage = 'Terjadi kesalahan'): string => {
    const apiError = error as AxiosErrorLike;
    const data = apiError.response?.data;

    if (!data) {
        return apiError.message || defaultMessage;
    }

    // Handle { message: '...' }
    if (typeof data.message === 'string') {
        return data.message;
    }

    // Handle { error: '...' }
    if (typeof data.error === 'string') {
        return data.error;
    }

    // Handle { error: { message: '...' } }
    if (typeof data.error === 'object' && data.error !== null && 'message' in data.error) {
        return String(data.error.message);
    }

    // Handle validation errors { errors: { field: ['message'] } }
    if (data.errors && typeof data.errors === 'object') {
        const firstField = Object.keys(data.errors)[0];
        if (firstField && Array.isArray(data.errors[firstField])) {
            return data.errors[firstField][0];
        }
    }

    return defaultMessage;
};

/**
 * Get first validation error message
 */
export const getValidationError = (error: unknown): string | null => {
    const apiError = error as AxiosErrorLike;
    const errors = apiError.response?.data?.errors;

    if (!errors || typeof errors !== 'object') {
        return null;
    }

    const firstField = Object.keys(errors)[0];
    if (firstField && Array.isArray(errors[firstField])) {
        return errors[firstField][0];
    }

    return null;
};

/**
 * Check if error is a specific HTTP status
 */
export const isHttpError = (error: unknown, status: number): boolean => {
    const apiError = error as AxiosErrorLike;
    return apiError.response?.status === status;
};

/**
 * Handle common API errors with callbacks
 */
export interface ErrorHandlers {
    on401?: () => void;
    on403?: () => void;
    on404?: () => void;
    on500?: () => void;
    onError?: (message: string) => void;
}

export const handleApiError = (error: unknown, handlers?: ErrorHandlers): string => {
    const apiError = error as AxiosErrorLike;
    const status = apiError.response?.status;

    if (status === 401) {
        handlers?.on401?.();
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
    }

    if (status === 403) {
        handlers?.on403?.();
        return 'Anda tidak memiliki akses ke fitur ini.';
    }

    if (status === 404) {
        handlers?.on404?.();
        return 'Data tidak ditemukan.';
    }

    if (status === 500) {
        handlers?.on500?.();
        return 'Terjadi kesalahan pada server.';
    }

    const message = getErrorMessage(error);
    handlers?.onError?.(message);
    return message;
};
