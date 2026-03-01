<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\AttendanceImportRequest;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AttendanceService $service) {}

    /** GET /attendances - List all attendances */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $params = $this->normalizeListParams($request);
        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapAttendanceRows($data);

        return Inertia::render('Attendances/Index', [
            'attendances' => $data,
            'students' => $this->studentOptions(),
            'classes' => $this->classOptions(),
            'recorders' => $this->recorderOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /attendances/{id} - Show attendance details */
    public function show(Attendance $attendance)
    {
        $this->authorize('view', $attendance);

        $model = $attendance->load(['student:id,name,email', 'classroom:id,name', 'recordedBy:id,name,email']);

        return Inertia::render('Attendances/Show', [
            'attendance' => $this->mapAttendanceRow($model),
        ]);
    }

    /** GET /attendances/create - Show create form */
    public function create()
    {
        $this->authorize('create', Attendance::class);

        return Inertia::render('Attendances/Create', [
            'students' => $this->studentOptions(),
            'classes' => $this->classOptions(),
            'recorders' => $this->recorderOptions(),
        ]);
    }

    /** POST /attendances - Store new attendance */
    public function store(StoreAttendanceRequest $request)
    {
        $this->authorize('create', Attendance::class);

        $this->service->store($request->validated());

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance recorded successfully.');
    }

    /** POST /attendances/batch-store - Store multiple attendances */
    public function batchStore(Request $request)
    {
        $this->authorize('create', Attendance::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.class_id' => ['required', 'integer', 'exists:classes,id'],
            'items.*.date' => ['required', 'date'],
            'items.*.status' => ['required', 'in:pre,a,per,l'],
            'items.*.recorded_by' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'student_id' => (int) $item['student_id'],
                'class_id' => (int) $item['class_id'],
                'date' => (string) $item['date'],
                'status' => (string) $item['status'],
                'recorded_by' => $item['recorded_by'] ?? null,
            ])
            ->values();

        $duplicateKeys = $items
            ->map(fn (array $item): string => $item['student_id'].'|'.$item['class_id'].'|'.$item['date'])
            ->duplicates();

        if ($duplicateKeys->isNotEmpty()) {
            return back()->withErrors([
                'items' => 'Batch contains duplicate rows for the same student, class, and date.',
            ]);
        }

        foreach ($items as $item) {
            $alreadyExists = Attendance::withTrashed()
                ->where('student_id', $item['student_id'])
                ->where('class_id', $item['class_id'])
                ->whereDate('date', $item['date'])
                ->exists();

            if ($alreadyExists) {
                return back()->withErrors([
                    'items' => 'One or more rows already exist for the same student, class, and date.',
                ]);
            }
        }

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' attendance records created successfully.');
    }

    /** GET /attendances/{id}/edit - Show edit form */
    public function edit(Attendance $attendance)
    {
        $this->authorize('update', $attendance);

        return Inertia::render('Attendances/Edit', [
            'attendance' => $this->mapAttendanceRow($attendance->load(['student:id,name,email', 'classroom:id,name', 'recordedBy:id,name,email'])),
            'students' => $this->studentOptions(),
            'classes' => $this->classOptions(),
            'recorders' => $this->recorderOptions(),
        ]);
    }

    /** PUT /attendances/{id} - Update attendance */
    public function update(UpdateAttendanceRequest $request, Attendance $attendance)
    {
        $this->authorize('update', $attendance);

        $this->service->update($attendance, $request->validated());

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance updated successfully.');
    }

    /** POST /attendances/batch-update - Update selected attendance rows */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:attendances,id'],
            'status' => ['required', 'in:pre,a,per,l'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $attendances = $this->resolveBatchAttendances($ids);
        $this->authorizeBatch($attendances, 'update');

        DB::transaction(function () use ($ids, $attendances, $validated): void {
            foreach ($ids as $id) {
                $attendance = $attendances->get($id);
                if (! $attendance instanceof Attendance) {
                    continue;
                }

                $this->service->update($attendance, [
                    'status' => $validated['status'],
                ]);
            }
        });

        return back()->with('success', count($ids).' attendance records updated successfully.');
    }

    /** DELETE /attendances/{id} - Delete attendance */
    public function destroy(Attendance $attendance)
    {
        $this->authorize('delete', $attendance);

        $this->service->delete($attendance);

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance deleted successfully.');
    }

    /** POST /attendances/batch-delete - Delete multiple attendances */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:attendances,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $attendances = $this->resolveBatchAttendances($ids);
        $this->authorizeBatch($attendances, 'delete');

        DB::transaction(function () use ($ids, $attendances): void {
            foreach ($ids as $id) {
                $attendance = $attendances->get($id);
                if (! $attendance instanceof Attendance) {
                    continue;
                }

                $this->service->delete($attendance);
            }
        });

        return back()->with('success', count($ids).' attendance records deleted successfully.');
    }

    /** GET /attendances/trashed - List trashed attendances */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $params = $this->normalizeListParams($request);
        $params['trashed'] = 'only';

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapAttendanceRows($data);

        return Inertia::render('Attendances/Trashed', [
            'attendances' => $data,
            'students' => $this->studentOptions(),
            'classes' => $this->classOptions(),
            'recorders' => $this->recorderOptions(),
            'query' => $request->all(),
        ]);
    }

    /** POST /attendances/{id}/restore - Restore attendance */
    public function restore($id)
    {
        $attendance = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $attendance);

        $this->service->restore((int) $id);

        return redirect()->route('attendances.trashed')
            ->with('success', 'Attendance restored successfully.');
    }

    /** POST /attendances/batch-restore - Restore multiple attendances */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:attendances,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $trashedAttendances = Attendance::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($trashedAttendances as $attendance) {
            $this->authorize('restore', $attendance);
        }

        DB::transaction(function () use ($ids, $trashedAttendances): void {
            foreach ($ids as $id) {
                if (! $trashedAttendances->has($id)) {
                    continue;
                }

                $this->service->restore((int) $id);
            }
        });

        return back()->with('success', count($ids).' attendance records restored successfully.');
    }

    /** DELETE /attendances/{id}/force - Force delete attendance */
    public function forceDelete($id)
    {
        $attendance = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $attendance);

        $this->service->forceDelete((int) $id);

        return redirect()->route('attendances.trashed')
            ->with('success', 'Attendance permanently deleted.');
    }

    /** POST /attendances/batch-force-delete - Permanently delete multiple attendances */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:attendances,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $trashedAttendances = Attendance::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($trashedAttendances as $attendance) {
            $this->authorize('forceDelete', $attendance);
        }

        DB::transaction(function () use ($ids, $trashedAttendances): void {
            foreach ($ids as $id) {
                if (! $trashedAttendances->has($id)) {
                    continue;
                }

                $this->service->forceDelete((int) $id);
            }
        });

        return back()->with('success', count($ids).' attendance records permanently deleted.');
    }

    /** POST /attendances/import - Import from file */
    public function import(AttendanceImportRequest $request)
    {
        $this->authorize('import', Attendance::class);

        $file = $request->file('file');
        $this->service->import($file);

        return redirect()->route('attendances.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /attendances/export/csv - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Attendance::class);

        return $this->service->exportCsv();
    }

    /** GET /attendances/suggestions - Live search suggestions */
    public function suggestions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Attendance::class);

        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            return response()->json(['data' => []]);
        }

        $term = mb_strtolower($query);
        $rows = Attendance::query()
            ->with(['student:id,name', 'classroom:id,name'])
            ->select(['id', 'student_id', 'class_id', 'date', 'status'])
            ->where(function (Builder $builder) use ($term): void {
                $builder->orWhereRaw('LOWER(status) LIKE ?', ["%{$term}%"]);
                $builder->orWhereRaw('LOWER(CAST(date AS CHAR)) LIKE ?', ["%{$term}%"]);
                $builder->orWhereHas('student', function (Builder $studentQuery) use ($term): void {
                    $studentQuery->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                });
                $builder->orWhereHas('classroom', function (Builder $classroomQuery) use ($term): void {
                    $classroomQuery->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                });
            })
            ->latest('id')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => $rows->map(fn (Attendance $attendance) => [
                'id' => $attendance->id,
                'label' => sprintf(
                    '%s · %s · %s',
                    $attendance->student?->name ?? 'Unknown Student',
                    $attendance->classroom?->name ?? 'Unknown Class',
                    $attendance->date?->toDateString() ?? '-'
                ),
            ])->values(),
        ]);
    }

    private function normalizeListParams(Request $request): array
    {
        $params = $request->all();

        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }

        $studentFilter = trim((string) $request->query('student_id', ''));
        if ($studentFilter !== '') {
            $params['filter']['student_id'] = $studentFilter;
        }

        $classFilter = trim((string) $request->query('class_id', ''));
        if ($classFilter !== '') {
            $params['filter']['class_id'] = $classFilter;
        }

        $statusFilter = trim((string) $request->query('status', ''));
        if ($statusFilter !== '') {
            $params['filter']['status'] = $statusFilter;
        }

        $dateFilter = trim((string) $request->query('date', ''));
        if ($dateFilter !== '') {
            $params['filter']['date'] = $dateFilter;
        }

        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'date', 'status', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        return $params;
    }

    private function mapAttendanceRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()
                ->map(fn (Attendance $attendance) => $this->mapAttendanceRow($attendance))
        );
    }

    private function mapAttendanceRow(Attendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'student_id' => $attendance->student_id,
            'student_name' => $attendance->student?->name,
            'class_id' => $attendance->class_id,
            'class_name' => $attendance->classroom?->name,
            'date' => $attendance->date?->toDateString(),
            'status' => $attendance->status,
            'status_label' => $this->statusLabel($attendance->status),
            'recorded_by' => $attendance->recorded_by,
            'recorded_by_name' => $attendance->recordedBy?->name,
            'created_at' => $attendance->created_at,
            'updated_at' => $attendance->updated_at,
            'deleted_at' => $attendance->deleted_at,
        ];
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'pre' => 'Present',
            'a' => 'Absent',
            'per' => 'Permission',
            'l' => 'Late',
            default => '-',
        };
    }

    private function studentOptions(): array
    {
        return User::query()
            ->students()
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

    private function classOptions(): array
    {
        return Classroom::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (Classroom $classroom) => [
                'id' => $classroom->id,
                'name' => $classroom->name,
            ])
            ->values()
            ->all();
    }

    private function recorderOptions(): array
    {
        return User::query()
            ->teachers()
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
     * @return Collection<int, Attendance>
     */
    private function resolveBatchAttendances(array $ids): Collection
    {
        return Attendance::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Attendance>  $attendances
     */
    private function authorizeBatch(Collection $attendances, string $ability): void
    {
        foreach ($attendances as $attendance) {
            $this->authorize($ability, $attendance);
        }
    }
}
