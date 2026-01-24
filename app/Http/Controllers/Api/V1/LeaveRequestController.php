<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LeaveRequest\LeaveRequestImportRequest;
use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Http\Resources\LeaveRequest\LeaveRequestCollection;
use App\Http\Resources\LeaveRequest\LeaveRequestResource;
use App\Models\LeaveRequest;
use App\Services\LeaveRequestService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private LeaveRequestService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new LeaveRequestCollection($data));
    }

    public function show(LeaveRequest $leaveRequest)
    {
        $this->authorize('view', $leaveRequest);

        $model = $this->service->show($leaveRequest);

        return ApiResponse::ok(new LeaveRequestResource($model));
    }

    public function store(StoreLeaveRequestRequest $request)
    {
        $this->authorize('create', LeaveRequest::class);

        $item = $this->service->store($request->validated());

        return ApiResponse::created(new LeaveRequestResource($item));
    }

    public function update(UpdateLeaveRequestRequest $request, LeaveRequest $leaveRequest)
    {
        $this->authorize('update', $leaveRequest);

        $updated = $this->service->update($leaveRequest, $request->validated());

        return ApiResponse::ok(new LeaveRequestResource($updated));
    }

    public function destroy(LeaveRequest $leaveRequest)
    {
        $this->authorize('delete', $leaveRequest);

        $this->service->delete($leaveRequest);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new LeaveRequestCollection($data));
    }

    public function findTrashed($id)
    {
        $leaveRequest = $this->service->findTrashed((int) $id);
        $this->authorize('view', $leaveRequest);

        return ApiResponse::ok(new LeaveRequestResource($leaveRequest));
    }

    public function restore($id)
    {
        $leaveRequest = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $leaveRequest);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new LeaveRequestResource($restored));
    }

    public function forceDelete($id)
    {
        $leaveRequest = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $leaveRequest);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(LeaveRequestImportRequest $request)
    {
        $this->authorize('import', LeaveRequest::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', LeaveRequest::class);

        return $this->service->exportCsv();
    }
}
