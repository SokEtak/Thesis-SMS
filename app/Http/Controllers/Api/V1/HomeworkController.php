<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Homework;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use App\Services\HomeworkService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Homework\StoreHomeworkRequest;
use App\Http\Requests\Homework\UpdateHomeworkRequest;
use App\Http\Requests\Homework\HomeworkImportRequest;
use App\Http\Resources\Homework\HomeworkCollection;
use App\Http\Resources\Homework\HomeworkResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class HomeworkController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HomeworkService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Homework::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new HomeworkCollection($data));
    }

    public function show(Homework $homework)
    {
        $this->authorize('view', $homework);

        $model = $this->service->show($homework);
        
        return ApiResponse::ok(new HomeworkResource($model));
    }

    public function store(StoreHomeworkRequest $request)
    {
        $data = $request->validated();
        
        $data['teacher_id'] = $request->user()->id;

        $item = $this->service->store($data);

        return ApiResponse::created(new HomeworkResource($item));
    }

    public function update(UpdateHomeworkRequest $request, Homework $homework)
    {
        $data['teacher_id'] = $request->user()->id;
        
        $updated = $this->service->update($homework, $request->validated());

        return ApiResponse::ok(new HomeworkResource($updated));
    }

    public function destroy(Homework $homework)
    {
        $this->authorize('delete', $homework);

        $this->service->delete($homework);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Homework::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new HomeworkCollection($data));
    }

    public function findTrashed($id)
    {
        $homework = $this->service->findTrashed((int) $id);
        $this->authorize('view', $homework);

        return ApiResponse::ok(new HomeworkResource($homework));
    }

    public function restore($id)
    {
        $homework = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $homework);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new HomeworkResource($restored));
    }

    public function forceDelete($id)
    {
        $homework = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $homework);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(HomeworkImportRequest $request)
    {
        $this->authorize('import', Homework::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', Homework::class);

        return $this->service->exportCsv();
    }
}
