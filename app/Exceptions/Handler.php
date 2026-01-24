<?php

namespace App\Exceptions;

use App\Helpers\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        // add benign exceptions if needed
    ];

    public function register(): void
    {
        /** Reportable: hook for logging / APM (Sentry/DataDog) */
        $this->reportable(function (Throwable $e) {
            // Example: send enriched context to logger/APM
            // logger()->error($e->getMessage(), ['exception' => $e]);
        });

        /** Renderable: JSON for API requests */
        $this->renderable(function (Throwable $e, $request) {
            if (! $this->wantsJson($request)) {
                return null; // fall back to default HTML rendering
            }

            // Validation
            if ($e instanceof ValidationException) {
                return ApiResponse::error(
                    'validation_error',
                    'The given data was invalid.',
                    422,
                    $e->errors(),
                    ['timestamp' => now()->toIso8601String()]
                );
            }

            // Authn
            if ($e instanceof AuthenticationException) {
                return ApiResponse::error(
                    'unauthenticated',
                    'Unauthenticated.',
                    401
                );
            }

            // Authz (Policies/Gates)
            if ($e instanceof AuthorizationException) {
                return ApiResponse::error(
                    'forbidden',
                    $e->getMessage() ?: 'This action is unauthorized.',
                    403
                );
            }

            // 404 (route or model)
            if ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException) {
                return ApiResponse::error(
                    'not_found',
                    'Resource not found.',
                    404
                );
            }

            // Method not allowed
            if ($e instanceof MethodNotAllowedHttpException) {
                return ApiResponse::error(
                    'method_not_allowed',
                    'HTTP method not allowed for this endpoint.',
                    405
                );
            }

            // Throttling (rate limits)
            if ($e instanceof ThrottleRequestsException || $e instanceof TooManyRequestsHttpException) {
                return ApiResponse::error(
                    'too_many_requests',
                    'Too many requests. Please slow down.',
                    429
                );
            }

            // CSRF (for web forms or Sanctum cookie flows)
            if ($e instanceof TokenMismatchException) {
                return ApiResponse::error(
                    'token_mismatch',
                    'CSRF token mismatch.',
                    419
                );
            }

            // Payload too large (file uploads)
            if ($e instanceof PostTooLargeException) {
                return ApiResponse::error(
                    'payload_too_large',
                    'The uploaded payload is too large.',
                    413
                );
            }

            // Database/Query exceptions (don’t leak internals)
            if ($e instanceof QueryException) {
                return ApiResponse::error(
                    'database_error',
                    'A database error occurred.',
                    500
                );
            }

            // Generic HttpException with custom code
            if ($e instanceof HttpException) {
                $status = $e->getStatusCode();

                return ApiResponse::error(
                    'http_error',
                    $e->getMessage() ?: 'HTTP error.',
                    $status
                );
            }

            // Fallback: Internal Server Error
            return ApiResponse::error(
                'server_error',
                'An unexpected error occurred.',
                500
            );
        });
    }

    /** Keep default render for non-JSON requests (web) */
    public function render($request, Throwable $e)
    {
        return parent::render($request, $e);
    }

    /** Utility: detect JSON/API request */
    protected function wantsJson($request): bool
    {
        // Force JSON for anything under /api
        if (str_starts_with($request->path(), 'api/')) {
            return true;
        }

        // Otherwise, honor the request headers
        return $request->expectsJson();
    }
}
