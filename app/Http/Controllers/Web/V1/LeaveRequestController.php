<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeaveRequest\LeaveRequestImportRequest;
use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\LeaveRequestService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaveRequestController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private LeaveRequestService $service) {}

    /** GET /leave-requests - List all leave requests */
    public function index(Request $request)
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $params = $request->all();
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $studentFilter = trim((string) $request->query('student_id', ''));
        if ($studentFilter !== '') {
            $params['filter']['student_id'] = $studentFilter;
        }
        $statusFilter = trim((string) $request->query('status', ''));
        if ($statusFilter !== '') {
            $params['filter']['status'] = $statusFilter;
        }
        $approverFilter = trim((string) $request->query('approved_by', ''));
        if ($approverFilter !== '') {
            $params['filter']['approved_by'] = $approverFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'start_date', 'end_date', 'status', 'approved_at', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapLeaveRequestRows($data);

        return Inertia::render('LeaveRequests/Index', [
            'leaveRequests' => $data,
            'students' => $this->studentOptions(),
            'approvers' => $this->approverOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /leave-requests/{id} - Show leave request details */
    public function show(LeaveRequest $leaveRequest)
    {
        $this->authorize('view', $leaveRequest);

        $model = $this->service->show($leaveRequest);
        $model->loadMissing([
            'student:id,name,email',
            'approver:id,name,email',
        ]);

        return Inertia::render('LeaveRequests/Show', [
            'leaveRequest' => $model,
        ]);
    }

    /** GET /leave-requests/create - Show create form */
    public function create()
    {
        $this->authorize('create', LeaveRequest::class);

        return Inertia::render('LeaveRequests/Create', [
            'students' => $this->studentOptions(),
            'approvers' => $this->approverOptions(),
        ]);
    }

    /** POST /leave-requests - Store new leave request */
    public function store(StoreLeaveRequestRequest $request)
    {
        $this->authorize('create', LeaveRequest::class);

        $this->service->store($request->validated());

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request submitted successfully.');
    }

    /** POST /leave-requests/batch-store - Store multiple leave requests */
    public function batchStore(Request $request)
    {
        $this->authorize('create', LeaveRequest::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.start_date' => ['required', 'date'],
            'items.*.end_date' => ['required', 'date'],
            'items.*.reason' => ['nullable', 'string'],
            'items.*.status' => ['required', 'in:Pending,Approved,Rejected,Cancelled'],
            'items.*.approved_by' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'student_id' => (int) $item['student_id'],
                'start_date' => (string) $item['start_date'],
                'end_date' => (string) $item['end_date'],
                'reason' => $item['reason'] ?? null,
                'status' => (string) $item['status'],
                'approved_by' => $item['approved_by'] ?? null,
            ])
            ->values();

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' leave request records created successfully.');
    }

    /** GET /leave-requests/{id}/edit - Show edit form */
    public function edit(LeaveRequest $leaveRequest)
    {
        $this->authorize('update', $leaveRequest);

        return Inertia::render('LeaveRequests/Edit', [
            'leaveRequest' => $leaveRequest,
            'students' => $this->studentOptions(),
            'approvers' => $this->approverOptions(),
        ]);
    }

    /** PUT /leave-requests/{id} - Update leave request */
    public function update(UpdateLeaveRequestRequest $request, LeaveRequest $leaveRequest)
    {
        $this->authorize('update', $leaveRequest);

        $this->service->update($leaveRequest, $request->validated());

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request updated successfully.');
    }

    /** POST /leave-requests/batch-update - Update selected leave request rows */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:leave_requests,id'],
            'status' => ['required', 'in:Pending,Approved,Rejected,Cancelled'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'update');

        DB::transaction(function () use ($ids, $rows, $validated): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof LeaveRequest) {
                    continue;
                }

                $this->service->update($row, [
                    'status' => $validated['status'],
                ]);
            }
        });

        return back()->with('success', count($ids).' leave request records updated successfully.');
    }

    /** DELETE /leave-requests/{id} - Delete leave request */
    public function destroy(LeaveRequest $leaveRequest)
    {
        $this->authorize('delete', $leaveRequest);

        $this->service->delete($leaveRequest);

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request deleted successfully.');
    }

    /** POST /leave-requests/batch-delete - Delete multiple leave requests */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:leave_requests,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'delete');

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof LeaveRequest) {
                    continue;
                }

                $this->service->delete($row);
            }
        });

        return back()->with('success', count($ids).' leave request records deleted successfully.');
    }

    /** GET /leave-requests/trashed - List trashed leave requests */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $params = $request->all();
        $params['trashed'] = 'only';
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $studentFilter = trim((string) $request->query('student_id', ''));
        if ($studentFilter !== '') {
            $params['filter']['student_id'] = $studentFilter;
        }
        $statusFilter = trim((string) $request->query('status', ''));
        if ($statusFilter !== '') {
            $params['filter']['status'] = $statusFilter;
        }
        $approverFilter = trim((string) $request->query('approved_by', ''));
        if ($approverFilter !== '') {
            $params['filter']['approved_by'] = $approverFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'start_date', 'end_date', 'status', 'approved_at', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapLeaveRequestRows($data);

        return Inertia::render('LeaveRequests/Trashed', [
            'leaveRequests' => $data,
            'students' => $this->studentOptions(),
            'approvers' => $this->approverOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /leave-requests/{id}/restore - Restore leave request */
    public function restore($id)
    {
        $leaveRequest = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $leaveRequest);

        $this->service->restore((int) $id);

        return redirect()->route('leave-requests.trashed')
            ->with('success', 'Leave request restored successfully.');
    }

    /** POST /leave-requests/batch-restore - Restore multiple leave requests */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:leave_requests,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = LeaveRequest::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($rows as $row) {
            $this->authorize('restore', $row);
        }

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                if (! $rows->has($id)) {
                    continue;
                }

                $this->service->restore((int) $id);
            }
        });

        return back()->with('success', count($ids).' leave request records restored successfully.');
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

    /** POST /leave-requests/batch-force-delete - Permanently delete multiple leave requests */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:leave_requests,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = LeaveRequest::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($rows as $row) {
            $this->authorize('forceDelete', $row);
        }

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                if (! $rows->has($id)) {
                    continue;
                }

                $this->service->forceDelete((int) $id);
            }
        });

        return back()->with('success', count($ids).' leave request records permanently deleted.');
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

    private function mapLeaveRequestRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (LeaveRequest $leaveRequest) {
                return [
                    'id' => $leaveRequest->id,
                    'student_id' => $leaveRequest->student_id,
                    'student_name' => $leaveRequest->student?->name,
                    'start_date' => $leaveRequest->start_date?->toDateString(),
                    'end_date' => $leaveRequest->end_date?->toDateString(),
                    'reason' => $leaveRequest->reason,
                    'status' => $leaveRequest->status,
                    'approved_by' => $leaveRequest->approved_by,
                    'approved_by_name' => $leaveRequest->approver?->name,
                    'approved_at' => $leaveRequest->approved_at?->toDateTimeString(),
                    'created_at' => $leaveRequest->created_at,
                    'updated_at' => $leaveRequest->updated_at,
                    'deleted_at' => $leaveRequest->deleted_at,
                ];
            })
        );
    }

    private function studentOptions(): array
    {
        return User::query()
            ->students()
            ->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
            ])
            ->values()
            ->all();
    }

    private function approverOptions(): array
    {
        return User::query()
            ->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values()
            ->all();
    }

    private function sanitizeBatchIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    /**
     * @param  int[]  $ids
     * @return Collection<int, LeaveRequest>
     */
    private function resolveBatchRows(array $ids): Collection
    {
        return LeaveRequest::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, LeaveRequest>  $rows
     */
    private function authorizeBatch(Collection $rows, string $ability): void
    {
        foreach ($rows as $row) {
            $this->authorize($ability, $row);
        }
    }
}
