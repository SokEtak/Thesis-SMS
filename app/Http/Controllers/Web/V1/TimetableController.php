<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Timetable\StoreTimetableRequest;
use App\Http\Requests\Timetable\TimetableImportRequest;
use App\Http\Requests\Timetable\UpdateTimetableRequest;
use App\Models\Classroom;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\User;
use App\Services\TimetableService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TimetableController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private TimetableService $service) {}

    /** GET /timetables - List all timetables */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Timetable::class);

        $params = $request->all();
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $classFilter = trim((string) $request->query('class_id', ''));
        if ($classFilter !== '') {
            $params['filter']['class_id'] = $classFilter;
        }
        $subjectFilter = trim((string) $request->query('subject_id', ''));
        if ($subjectFilter !== '') {
            $params['filter']['subject_id'] = $subjectFilter;
        }
        $teacherFilter = trim((string) $request->query('teacher_id', ''));
        if ($teacherFilter !== '') {
            $params['filter']['teacher_id'] = $teacherFilter;
        }
        $dayFilter = trim((string) $request->query('day_of_week', ''));
        if ($dayFilter !== '') {
            $params['filter']['day_of_week'] = $dayFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'day_of_week', 'start_time', 'end_time', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapTimetableRows($data);

        return Inertia::render('Timetables/Index', [
            'timetables' => $data,
            'classes' => $this->classOptions(),
            'subjects' => $this->subjectOptions(),
            'teachers' => $this->teacherOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /timetables/{id} - Show timetable details */
    public function show(Timetable $timetable)
    {
        $this->authorize('view', $timetable);

        $model = $this->service->show($timetable);
        $model->loadMissing([
            'classroom:id,name',
            'subject:id,name',
            'teacher:id,name,email',
        ]);

        return Inertia::render('Timetables/Show', [
            'timetable' => $model,
        ]);
    }

    /** GET /timetables/create - Show create form */
    public function create()
    {
        $this->authorize('create', Timetable::class);

        return Inertia::render('Timetables/Create', [
            'classes' => $this->classOptions(),
            'subjects' => $this->subjectOptions(),
            'teachers' => $this->teacherOptions(),
        ]);
    }

    /** POST /timetables - Store new timetable */
    public function store(StoreTimetableRequest $request)
    {
        $this->authorize('create', Timetable::class);

        $this->service->store($request->validated());

        return redirect()->route('timetables.index')
            ->with('success', 'Timetable created successfully.');
    }

    /** POST /timetables/batch-store - Store multiple timetables */
    public function batchStore(Request $request)
    {
        $this->authorize('create', Timetable::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.day_of_week' => ['required', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'items.*.start_time' => ['required', 'date_format:H:i'],
            'items.*.end_time' => ['required', 'date_format:H:i'],
            'items.*.subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'items.*.class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'items.*.teacher_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'day_of_week' => (string) $item['day_of_week'],
                'start_time' => (string) $item['start_time'],
                'end_time' => (string) $item['end_time'],
                'subject_id' => $item['subject_id'] ?? null,
                'class_id' => $item['class_id'] ?? null,
                'teacher_id' => $item['teacher_id'] ?? null,
            ])
            ->values();

        foreach ($items as $index => $item) {
            if (strtotime($item['end_time']) <= strtotime($item['start_time'])) {
                return back()->withErrors([
                    'items.'.$index.'.end_time' => 'End time must be after start time.',
                ]);
            }
        }

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' timetable records created successfully.');
    }

    /** GET /timetables/{id}/edit - Show edit form */
    public function edit(Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        return Inertia::render('Timetables/Edit', [
            'timetable' => $timetable,
            'classes' => $this->classOptions(),
            'subjects' => $this->subjectOptions(),
            'teachers' => $this->teacherOptions(),
        ]);
    }

    /** PUT /timetables/{id} - Update timetable */
    public function update(UpdateTimetableRequest $request, Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        $this->service->update($timetable, $request->validated());

        return redirect()->route('timetables.index')
            ->with('success', 'Timetable updated successfully.');
    }

    /** POST /timetables/batch-update - Update selected timetable rows */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:timetables,id'],
            'day_of_week' => ['nullable', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $payload = collect([
            'day_of_week' => $validated['day_of_week'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'subject_id' => $validated['subject_id'] ?? null,
            'class_id' => $validated['class_id'] ?? null,
            'teacher_id' => $validated['teacher_id'] ?? null,
        ])
            ->filter(fn (mixed $value): bool => $value !== null && $value !== '')
            ->all();

        if (count($payload) === 0) {
            return back()->withErrors([
                'batch_update' => 'Provide at least one field to update.',
            ]);
        }

        if (
            isset($payload['start_time'], $payload['end_time'])
            && strtotime((string) $payload['end_time']) <= strtotime((string) $payload['start_time'])
        ) {
            return back()->withErrors([
                'end_time' => 'End time must be after start time.',
            ]);
        }

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'update');

        DB::transaction(function () use ($ids, $rows, $payload): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof Timetable) {
                    continue;
                }

                $this->service->update($row, $payload);
            }
        });

        return back()->with('success', count($ids).' timetable records updated successfully.');
    }

    /** DELETE /timetables/{id} - Delete timetable */
    public function destroy(Timetable $timetable)
    {
        $this->authorize('delete', $timetable);

        $this->service->delete($timetable);

        return redirect()->route('timetables.index')
            ->with('success', 'Timetable deleted successfully.');
    }

    /** POST /timetables/batch-delete - Delete multiple timetables */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:timetables,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'delete');

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof Timetable) {
                    continue;
                }

                $this->service->delete($row);
            }
        });

        return back()->with('success', count($ids).' timetable records deleted successfully.');
    }

    /** GET /timetables/trashed - List trashed timetables */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Timetable::class);

        $params = $request->all();
        $params['trashed'] = 'only';
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $classFilter = trim((string) $request->query('class_id', ''));
        if ($classFilter !== '') {
            $params['filter']['class_id'] = $classFilter;
        }
        $subjectFilter = trim((string) $request->query('subject_id', ''));
        if ($subjectFilter !== '') {
            $params['filter']['subject_id'] = $subjectFilter;
        }
        $teacherFilter = trim((string) $request->query('teacher_id', ''));
        if ($teacherFilter !== '') {
            $params['filter']['teacher_id'] = $teacherFilter;
        }
        $dayFilter = trim((string) $request->query('day_of_week', ''));
        if ($dayFilter !== '') {
            $params['filter']['day_of_week'] = $dayFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'day_of_week', 'start_time', 'end_time', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapTimetableRows($data);

        return Inertia::render('Timetables/Trashed', [
            'timetables' => $data,
            'classes' => $this->classOptions(),
            'subjects' => $this->subjectOptions(),
            'teachers' => $this->teacherOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /timetables/{id}/restore - Restore timetable */
    public function restore($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $timetable);

        $this->service->restore((int) $id);

        return redirect()->route('timetables.trashed')
            ->with('success', 'Timetable restored successfully.');
    }

    /** POST /timetables/batch-restore - Restore multiple timetables */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:timetables,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = Timetable::onlyTrashed()
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

        return back()->with('success', count($ids).' timetable records restored successfully.');
    }

    /** DELETE /timetables/{id}/force - Force delete timetable */
    public function forceDelete($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $timetable);

        $this->service->forceDelete((int) $id);

        return redirect()->route('timetables.trashed')
            ->with('success', 'Timetable permanently deleted.');
    }

    /** POST /timetables/batch-force-delete - Permanently delete multiple timetables */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:timetables,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = Timetable::onlyTrashed()
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

        return back()->with('success', count($ids).' timetable records permanently deleted.');
    }

    /** POST /timetables/import - Import from file */
    public function import(TimetableImportRequest $request)
    {
        $this->authorize('import', Timetable::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('timetables.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /timetables/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Timetable::class);

        return $this->service->exportCsv();
    }

    private function mapTimetableRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (Timetable $timetable) {
                return [
                    'id' => $timetable->id,
                    'class_id' => $timetable->class_id,
                    'class_name' => $timetable->classroom?->name,
                    'subject_id' => $timetable->subject_id,
                    'subject_name' => $timetable->subject?->name,
                    'teacher_id' => $timetable->teacher_id,
                    'teacher_name' => $timetable->teacher?->name,
                    'day_of_week' => $timetable->day_of_week,
                    'start_time' => $timetable->start_time,
                    'end_time' => $timetable->end_time,
                    'created_at' => $timetable->created_at,
                    'updated_at' => $timetable->updated_at,
                    'deleted_at' => $timetable->deleted_at,
                ];
            })
        );
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

    private function subjectOptions(): array
    {
        return Subject::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
            ])
            ->values()
            ->all();
    }

    private function teacherOptions(): array
    {
        return User::query()
            ->teachers()
            ->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (User $teacher) => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
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
     * @return Collection<int, Timetable>
     */
    private function resolveBatchRows(array $ids): Collection
    {
        return Timetable::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Timetable>  $rows
     */
    private function authorizeBatch(Collection $rows, string $ability): void
    {
        foreach ($rows as $row) {
            $this->authorize($ability, $row);
        }
    }
}
