<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeaveRequest\LeaveRequestImportRequest;
use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Models\LeaveRequest;
use App\Services\LeaveRequestService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveRequestController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private LeaveRequestService $service) {}

    /** GET /leave-requests - List all leave requests */
    public function index(Request $request)
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $data = $this->service->list($request->all());

        return Inertia::render('LeaveRequests/Index', [
            'leaveRequests' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /leave-requests/{id} - Show leave request details */
    public function show(LeaveRequest $leaveRequest)
    {
        $this->authorize('view', $leaveRequest);

        $model = $this->service->show($leaveRequest);

        return Inertia::render('LeaveRequests/Show', [
            'leaveRequest' => $model,
        ]);
    }

    /** GET /leave-requests/create - Show create form */
    public function create()
    {
        $this->authorize('create', LeaveRequest::class);

        return Inertia::render('LeaveRequests/Create');
    }

    /** POST /leave-requests - Store new leave request */
    public function store(StoreLeaveRequestRequest $request)
    {
        $this->authorize('create', LeaveRequest::class);

        $leaveRequest = $this->service->store($request->validated());

        return redirect()->route('leave-requests.show', $leaveRequest->id)
            ->with('success', 'Leave request submitted successfully.');
    }

    /** GET /leave-requests/{id}/edit - Show edit form */
    public function edit(LeaveRequest $leaveRequest)
    {
        $this->authorize('update', $leaveRequest);

        return Inertia::render('LeaveRequests/Edit', [
            'leaveRequest' => $leaveRequest,
        ]);
    }

    /** PUT /leave-requests/{id} - Update leave request */
    public function update(UpdateLeaveRequestRequest $request, LeaveRequest $leaveRequest)
    {
        $this->authorize('update', $leaveRequest);

        $updated = $this->service->update($leaveRequest, $request->validated());

        return redirect()->route('leave-requests.show', $updated->id)
            ->with('success', 'Leave request updated successfully.');
    }

    /** DELETE /leave-requests/{id} - Delete leave request */
    public function destroy(LeaveRequest $leaveRequest)
    {
        $this->authorize('delete', $leaveRequest);

        $this->service->delete($leaveRequest);

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request deleted successfully.');
    }

    /** GET /leave-requests/trashed - List trashed leave requests */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('LeaveRequests/Trashed', [
            'leaveRequests' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /leave-requests/{id}/restore - Restore leave request */
    public function restore($id)
    {
        $leaveRequest = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $leaveRequest);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('leave-requests.show', $restored->id)
            ->with('success', 'Leave request restored successfully.');
    }

    /** DELETE /leave-requests/{id}/force - Force delete leave request */
    public function forceDelete($id)
    {
        $leaveRequest = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $leaveRequest);

        $this->service->forceDelete((int) $id);

        return redirect()->route('leave-requests.trashed')
            ->with('success', 'Leave request permanently deleted.');
    }

    /** POST /leave-requests/import - Import from file */
    public function import(LeaveRequestImportRequest $request)
    {
        $this->authorize('import', LeaveRequest::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('leave-requests.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /leave-requests/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', LeaveRequest::class);

        return $this->service->exportCsv();
    }
}
