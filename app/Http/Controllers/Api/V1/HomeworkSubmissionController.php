<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\HomeworkSubmission\HomeworkSubmissionImportRequest;
use App\Http\Requests\HomeworkSubmission\StoreHomeworkSubmissionRequest;
use App\Http\Requests\HomeworkSubmission\UpdateHomeworkSubmissionRequest;
use App\Http\Resources\HomeworkSubmission\HomeworkSubmissionCollection;
use App\Http\Resources\HomeworkSubmission\HomeworkSubmissionResource;
use App\Models\HomeworkSubmission;
use App\Services\HomeworkSubmissionService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class HomeworkSubmissionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HomeworkSubmissionService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', HomeworkSubmission::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new HomeworkSubmissionCollection($data));
    }

    public function show(HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('view', $homeworkSubmission);

        $model = $this->service->show($homeworkSubmission);

        return ApiResponse::ok(new HomeworkSubmissionResource($model));
    }

    public function store(StoreHomeworkSubmissionRequest $request)
    {

        $item = $this->service->store($request->validated());

        return ApiResponse::created(new HomeworkSubmissionResource($item));
    }

    public function update(UpdateHomeworkSubmissionRequest $request, HomeworkSubmission $homeworkSubmission)
    {

        $updated = $this->service->update($homeworkSubmission, $request->validated());

        return ApiResponse::ok(new HomeworkSubmissionResource($updated));
    }

    public function destroy(HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('delete', $homeworkSubmission);

        $this->service->delete($homeworkSubmission);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', HomeworkSubmission::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new HomeworkSubmissionCollection($data));
    }

    public function findTrashed($id)
    {
        $item = $this->service->findTrashed((int) $id);
        $this->authorize('view', $item);

        return ApiResponse::ok(new HomeworkSubmissionResource($item));
    }

    public function restore($id)
    {
        $item = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $item);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new HomeworkSubmissionResource($restored));
    }

    public function forceDelete($id)
    {
        $item = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $item);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(HomeworkSubmissionImportRequest $request)
    {
        $this->authorize('import', HomeworkSubmission::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', HomeworkSubmission::class);

        return $this->service->exportCsv();
    }
}
