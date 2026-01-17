<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Timetable;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use App\Services\TimetableService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Timetable\StoreTimetableRequest;
use App\Http\Requests\Timetable\UpdateTimetableRequest;
use App\Http\Requests\Timetable\TimetableImportRequest;
use App\Http\Resources\Timetable\TimetableCollection;
use App\Http\Resources\Timetable\TimetableResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TimetableController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private TimetableService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Timetable::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new TimetableCollection($data));
    }

    public function show(Timetable $timetable)
    {
        $this->authorize('view', $timetable);

        $model = $this->service->show($timetable);

        return ApiResponse::ok(new TimetableResource($model));
    }

    public function store(StoreTimetableRequest $request)
    {
        $this->authorize('create', Timetable::class);

        $item = $this->service->store($request->validated());

        return ApiResponse::created(new TimetableResource($item));
    }

    public function update(UpdateTimetableRequest $request, Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        $updated = $this->service->update($timetable, $request->validated());

        return ApiResponse::ok(new TimetableResource($updated));
    }

    public function destroy(Timetable $timetable)
    {
        $this->authorize('delete', $timetable);

        $this->service->delete($timetable);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Timetable::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new TimetableCollection($data));
    }

    public function findTrashed($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('view', $timetable);

        return ApiResponse::ok(new TimetableResource($timetable));
    }

    public function restore($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $timetable);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new TimetableResource($restored));
    }

    public function forceDelete($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $timetable);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(TimetableImportRequest $request)
    {
        $this->authorize('import', Timetable::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', Timetable::class);

        return $this->service->exportCsv();
    }
}
