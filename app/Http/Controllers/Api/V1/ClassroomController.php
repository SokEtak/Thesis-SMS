<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Classroom\ClassroomImportRequest;
use App\Http\Requests\Classroom\StoreClassroomRequest;
use App\Http\Requests\Classroom\UpdateClassroomRequest;
use App\Http\Resources\Classroom\ClassroomCollection;
use App\Http\Resources\Classroom\ClassroomResource;
use App\Models\Classroom;
use App\Services\ClassroomService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ClassroomService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Classroom::class);

        $data = $this->service->list($request->all());

        // keep query params in pagination links
        $data->appends($request->query());

        return ApiResponse::paginated(new ClassroomCollection($data));
    }

    public function show(Classroom $classroom)
    {
        $this->authorize('view', $classroom);

        $model = $this->service->show($classroom);

        return ApiResponse::ok(new ClassroomResource($model));
    }

    public function store(StoreClassroomRequest $request)
    {
        $this->authorize('create', Classroom::class);

        $classroom = $this->service->store($request->validated());

        return ApiResponse::created(new ClassroomResource($classroom));
    }

    public function update(UpdateClassroomRequest $request, Classroom $classroom)
    {
        $this->authorize('update', $classroom);

        $updated = $this->service->update($classroom, $request->validated());

        return ApiResponse::ok(new ClassroomResource($updated));
    }

    public function destroy(Classroom $classroom)
    {
        $this->authorize('delete', $classroom);

        $this->service->delete($classroom);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Classroom::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new ClassroomCollection($data));
    }

    public function findTrashed($id)
    {
        $classroom = $this->service->findTrashed((int) $id);
        $this->authorize('view', $classroom);

        return ApiResponse::ok(new ClassroomResource($classroom));
    }

    public function restore($id)
    {
        $classroom = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $classroom);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new ClassroomResource($restored));
    }

    public function forceDelete($id)
    {
        $classroom = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $classroom);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(ClassroomImportRequest $request)
    {
        $this->authorize('import', Classroom::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', Classroom::class);

        return $this->service->exportCsv();
    }
}
