<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ApiResponse
{
    public static function ok($data, $meta = []): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $data, 'meta' => $meta], 200);
    }

    public static function created($data): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $data], 201);
    }

    public static function deleted(): JsonResponse
    {
        return response()->json(['status' => 'success', 'message' => 'Deleted'], 200);
    }

    public static function paginated($resource): JsonResponse
    {
        $paginated = $resource->resource; // LengthAwarePaginator

        return response()->json([
            'status' => 'success',
            'data' => $resource,
            'meta' => [
                // Pagination details(Should hide some fields like first_page_url, last_page_url etc. if not needed)
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),

                // URLs
                'current_page_url' => $paginated->url($paginated->currentPage()),
                'first_page_url' => $paginated->url(1),
                'last_page_url' => $paginated->url($paginated->lastPage()),
                'next_page_url' => $paginated->nextPageUrl(),     // null on last page
                'prev_page_url' => $paginated->previousPageUrl(), // null on first page
                // 'path'              => $paginated->path(),

                // Range of items on the current page
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
        ], 200);
    }

    protected static function wrap($payload, int $status): JsonResponse
    {
        // add a trace id for observability (can be from request or generated)
        $payload['meta']['trace_id'] = $payload['meta']['trace_id'] ?? (string) Str::uuid();

        return response()->json($payload, $status);
    }

    public static function error(string $code, string $message, int $status = 400, array $errors = [], array $meta = []): JsonResponse
    {
        return self::wrap([
            'status' => 'error',
            'code' => $code,
            'message' => $message,
            'errors' => $errors ?: (object) [],
            'meta' => $meta,
        ], $status);
    }
}
