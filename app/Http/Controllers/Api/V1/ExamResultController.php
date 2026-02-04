<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ExamResult\ExamResultImportRequest;
use App\Http\Requests\ExamResult\StoreExamResultRequest;
use App\Http\Requests\ExamResult\UpdateExamResultRequest;
use App\Http\Resources\ExamResult\ExamResultCollection;
use App\Http\Resources\ExamResult\ExamResultResource;
use App\Models\ExamResult;
use App\Services\ExamResultService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class ExamResultController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ExamResultService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', ExamResult::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new ExamResultCollection($data));
    }

    public function show(ExamResult $examResult)
    {
        $model = $this->service->show($examResult);

        return ApiResponse::ok(
            new ExamResultResource($model)
        );
    }

    public function store(StoreExamResultRequest $request)
    {
        $examResult = $this->service->store($request->validated());

        return ApiResponse::created(new ExamResultResource($examResult));
    }

    public function update(
        UpdateExamResultRequest $request,
        ExamResult $examResult
    ) {
        $updated = $this->service->update(
            $examResult,
            $request->validated()
        );

        return ApiResponse::ok(new ExamResultResource($updated));
    }

    public function destroy(ExamResult $examResult)
    {
        $this->authorize('delete', $examResult);

        $this->service->delete($examResult);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', ExamResult::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);
        $data->appends($request->query());

        return ApiResponse::paginated(new ExamResultCollection($data));
    }

    public function restore($id)
    {
        $examResult = $this->service->findTrashed((int) $id);

        $this->authorize('restore', $examResult);

        $examResult = $this->service->restore((int) $id);

        return ApiResponse::ok(new ExamResultResource($examResult));
    }

    public function forceDelete($id)
    {
        $examResult = $this->service->findTrashed((int) $id);

        $this->authorize('forceDelete', $examResult);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(ExamResultImportRequest $request)
    {
        $this->authorize('import', ExamResult::class);

        $this->service->import($request->file('file'));

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', ExamResult::class);

        return $this->service->exportCsv();
    }
}
