<?php
namespace App\Http\Controllers\Api\V1;

use App\Models\Attendance;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use App\Services\AttendanceService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Requests\Attendance\AttendanceImportRequest;
use App\Http\Resources\Attendance\AttendanceCollection;
use App\Http\Resources\Attendance\AttendanceResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AttendanceService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new AttendanceCollection($data));
    }

    public function show(Attendance $attendance)
    {
        //use this concept to alert parent via event
        // dd($attendance->student->parent->only(['id','name']));
        $this->authorize('view', $attendance);

        $model = $this->service->show($attendance);

        return ApiResponse::ok(new AttendanceResource($model));
    }

    public function store(StoreAttendanceRequest $request)
    {
    // dd();    
    $this->authorize('create', Attendance::class);

        $attendance = $this->service->store($request->validated());

        return ApiResponse::created(new AttendanceResource($attendance));
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance)
    {
        $this->authorize('update', $attendance);

        $updated = $this->service->update($attendance, $request->validated());

        return ApiResponse::ok(new AttendanceResource($updated));
    }

    public function destroy(Attendance $attendance)
    {
        $this->authorize('delete', $attendance);

        $this->service->delete($attendance);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new AttendanceCollection($data));
    }

    public function findTrashed($id)
    {
        $attendance = $this->service->findTrashed((int) $id);
        $this->authorize('view', $attendance);

        return ApiResponse::ok(new AttendanceResource($attendance));
    }

    public function restore($id)
    {
        $attendance = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $attendance);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new AttendanceResource($restored));
    }

    public function forceDelete($id)
    {
        $attendance = $this->service->findTrashed($id);
        $this->authorize('forceDelete', $attendance);

        $this->service->forceDelete($id);

        return ApiResponse::deleted();
    }

    public function import(AttendanceImportRequest $request)
    {
        $this->authorize('import', Attendance::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', Attendance::class);

        return $this->service->exportCsv();
    }
}
