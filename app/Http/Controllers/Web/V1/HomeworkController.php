<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Homework\HomeworkImportRequest;
use App\Http\Requests\Homework\StoreHomeworkRequest;
use App\Http\Requests\Homework\UpdateHomeworkRequest;
use App\Models\Classroom;
use App\Models\Homework;
use App\Models\Subject;
use App\Models\User;
use App\Services\HomeworkService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HomeworkController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HomeworkService $service) {}

    /** GET /homeworks - List all homeworks */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Homework::class);

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
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'title', 'deadline', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapHomeworkRows($data);

        return Inertia::render('Homeworks/Index', [
            'homeworks' => $data,
            'classes' => $this->classOptions(),
            'subjects' => $this->subjectOptions(),
            'teachers' => $this->teacherOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /homeworks/{id} - Show homework details */
    public function show(Homework $homework)
    {
        $this->authorize('view', $homework);

        $model = $this->service->show($homework);

        return Inertia::render('Homeworks/Show', [
            'homework' => $model,
        ]);
    }

    /** GET /homeworks/create - Show create form */
    public function create()
    {
        $this->authorize('create', Homework::class);

        return Inertia::render('Homeworks/Create');
    }

    /** POST /homeworks - Store new homework */
    public function store(StoreHomeworkRequest $request)
    {
        $this->authorize('create', Homework::class);

        $data = $request->validated();
        $data['teacher_id'] = $request->user()->id;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('homeworks', 'public');
            $data['file_url'] = Storage::url($path);
        }

        $this->service->store($data);

        return redirect()->route('homeworks.index')
            ->with('success', 'Homework created successfully.');
    }

    /** POST /homeworks/batch-store - Store multiple homeworks */
    public function batchStore(Request $request)
    {
        $this->authorize('create', Homework::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.class_id' => ['required', 'integer', 'exists:classes,id'],
            'items.*.subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'items.*.teacher_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.title' => ['required', 'string', 'max:200'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.file_url' => ['nullable', 'string', 'max:255'],
            'items.*.deadline' => ['nullable', 'date'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'class_id' => (int) $item['class_id'],
                'subject_id' => (int) $item['subject_id'],
                'teacher_id' => (int) $item['teacher_id'],
                'title' => trim((string) $item['title']),
                'description' => $item['description'] ?? null,
                'file_url' => $item['file_url'] ?? null,
                'deadline' => $item['deadline'] ?? null,
            ])
            ->values();

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' homework records created successfully.');
    }

    /** GET /homeworks/{id}/edit - Show edit form */
    public function edit(Homework $homework)
    {
        $this->authorize('update', $homework);

        return Inertia::render('Homeworks/Edit', [
            'homework' => $homework,
        ]);
    }

    /** PUT /homeworks/{id} - Update homework */
    public function update(UpdateHomeworkRequest $request, Homework $homework)
    {
        $this->authorize('update', $homework);

        $data = $request->validated();
        $data['teacher_id'] = $request->user()->id;

        $updated = $this->service->update($homework, $data);

        return redirect()->route('homeworks.show', $updated->id)
            ->with('success', 'Homework updated successfully.');
    }

    /** POST /homeworks/batch-update - Update selected homework rows */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homeworks,id'],
            'deadline' => ['required', 'date'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'update');

        DB::transaction(function () use ($ids, $rows, $validated): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof Homework) {
                    continue;
                }

                $this->service->update($row, [
                    'deadline' => $validated['deadline'],
                ]);
            }
        });

        return back()->with('success', count($ids).' homework records updated successfully.');
    }

    /** DELETE /homeworks/{id} - Delete homework */
    public function destroy(Homework $homework)
    {
        $this->authorize('delete', $homework);

        $this->service->delete($homework);

        return redirect()->route('homeworks.index')
            ->with('success', 'Homework deleted successfully.');
    }

    /** POST /homeworks/batch-delete - Delete multiple homeworks */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homeworks,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'delete');

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof Homework) {
                    continue;
                }

                $this->service->delete($row);
            }
        });

        return back()->with('success', count($ids).' homework records deleted successfully.');
    }

    /** GET /homeworks/trashed - List trashed homeworks */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Homework::class);

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
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'title', 'deadline', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapHomeworkRows($data);

        return Inertia::render('Homeworks/Trashed', [
            'homeworks' => $data,
            'classes' => $this->classOptions(),
            'subjects' => $this->subjectOptions(),
            'teachers' => $this->teacherOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /homeworks/{id}/restore - Restore homework */
    public function restore($id)
    {
        $homework = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $homework);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('homeworks.show', $restored->id)
            ->with('success', 'Homework restored successfully.');
    }

    /** POST /homeworks/batch-restore - Restore multiple homeworks */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homeworks,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = Homework::onlyTrashed()
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

        return back()->with('success', count($ids).' homework records restored successfully.');
    }

    /** DELETE /homeworks/{id}/force - Force delete homework */
    public function forceDelete($id)
    {
        $homework = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $homework);

        $this->service->forceDelete((int) $id);

        return redirect()->route('homeworks.trashed')
            ->with('success', 'Homework permanently deleted.');
    }

    /** POST /homeworks/batch-force-delete - Permanently delete multiple homeworks */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homeworks,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = Homework::onlyTrashed()
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

        return back()->with('success', count($ids).' homework records permanently deleted.');
    }

    /** POST /homeworks/import - Import from file */
    public function import(HomeworkImportRequest $request)
    {
        $this->authorize('import', Homework::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('homeworks.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /homeworks/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Homework::class);

        return $this->service->exportCsv();
    }

    private function mapHomeworkRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (Homework $homework) {
                return [
                    'id' => $homework->id,
                    'title' => $homework->title,
                    'description' => $homework->description,
                    'deadline' => $homework->deadline,
                    'file_url' => $homework->file_url,
                    'class_id' => $homework->class_id,
                    'class_name' => $homework->classroom?->name,
                    'subject_id' => $homework->subject_id,
                    'subject_name' => $homework->subject?->name,
                    'teacher_id' => $homework->teacher_id,
                    'teacher_name' => $homework->teacher?->name,
                    'created_at' => $homework->created_at,
                    'updated_at' => $homework->updated_at,
                    'deleted_at' => $homework->deleted_at,
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
     * @return Collection<int, Homework>
     */
    private function resolveBatchRows(array $ids): Collection
    {
        return Homework::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Homework>  $rows
     */
    private function authorizeBatch(Collection $rows, string $ability): void
    {
        foreach ($rows as $row) {
            $this->authorize($ability, $row);
        }
    }
}
