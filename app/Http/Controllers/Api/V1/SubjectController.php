<?php
namespace App\Http\Controllers\Api\V1;

use App\Models\Subject;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use App\Services\SubjectService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Subject\SubjectStoreRequest;
use App\Http\Requests\Subject\SubjectUpdateRequest;
use App\Http\Requests\Subject\SubjectImportRequest;
use App\Http\Resources\Subject\SubjectCollection;
use App\Http\Resources\Subject\SubjectResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SubjectController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private SubjectService $service) {}

    public function index(Request $request)
    {
        // $this->authorize('viewAny', Subject::class);

        $data = $this->service->list($request->all());

        // keep query params in pagination links
        $data->appends($request->query());

        return ApiResponse::paginated(new SubjectCollection($data));
    }

    public function show(Subject $subject)
    {
        // $this->authorize('view', $subject);

        $model = $this->service->show($subject);

        return ApiResponse::ok(new SubjectResource($model));
    }

    public function store(SubjectStoreRequest $request)
    {
        // $this->authorize('create', Subject::class);

        $subject = $this->service->store($request->validated());

        return ApiResponse::created(new SubjectResource($subject));
    }

    public function update(SubjectUpdateRequest $request, Subject $subject)
    {
        // $this->authorize('update', $subject);

        $updated = $this->service->update($subject, $request->validated());

        return ApiResponse::ok(new SubjectResource($updated));
    }

    public function destroy(Subject $subject)
    {
        // $this->authorize('delete', $subject);

        $this->service->delete($subject);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        // $this->authorize('viewAny', Subject::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        // keep query params in pagination links
        $data->appends($request->query());

        return ApiResponse::paginated(new SubjectCollection($data));
    }

    public function findTrashed($id)
    {
        $subject = $this->service->findTrashed((int) $id);
        // $this->authorize('view', $subject);

        return ApiResponse::ok(new SubjectResource($subject));
    }

    public function restore($id)
    {
        $subject = $this->service->findTrashed((int) $id);
        // $this->authorize('restore', $subject);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new SubjectResource($restored));
    }

    public function forceDelete($id)
    {
        $subject = $this->service->findTrashed((int) $id);
        // $this->authorize('forceDelete', $subject);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(SubjectImportRequest $request)
    {
        // $this->authorize('import', Subject::class);

        $file = $request->file('file');

        $this->service->importSubjects($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        // $this->authorize('export', Subject::class);

        return $this->service->exportCsv();
    }
}