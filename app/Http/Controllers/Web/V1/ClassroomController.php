<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Classroom\ClassroomImportRequest;
use App\Http\Requests\Classroom\StoreClassroomRequest;
use App\Http\Requests\Classroom\UpdateClassroomRequest;
use App\Models\Classroom;
use App\Models\User;
use App\Services\ClassroomService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ClassroomController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ClassroomService $service) {}

    /** GET /classrooms - List all classrooms */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Classroom::class);

        $params = $request->all();
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $teacherFilter = trim((string) $request->query('teacher_in_charge_id', ''));
        if ($teacherFilter !== '') {
            $params['filter']['teacher_in_charge_id'] = $teacherFilter;
        }

        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'name', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapTeacherName($data);

        return Inertia::render('Classrooms/Index', [
            'classrooms' => $data,
            'teachers' => $this->teacherOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /classrooms/{id} - Show classroom details */
    public function show(Classroom $classroom)
    {
        $this->authorize('view', $classroom);

        $model = $this->service->show($classroom);

        return Inertia::render('Classrooms/Show', [
            'classroom' => $model,
        ]);
    }

    /** GET /classrooms/create - Show create form */
    public function create()
    {
        $this->authorize('create', Classroom::class);

        return Inertia::render('Classrooms/Create', [
            'teachers' => $this->teacherOptions(),
        ]);
    }

    /** POST /classrooms - Store new classroom */
    public function store(StoreClassroomRequest $request)
    {
        $this->authorize('create', Classroom::class);

        $this->service->store($request->validated());

        return redirect()->route('classrooms.index')
            ->with('success', 'Classroom created successfully.');
    }

    /** GET /classrooms/{id}/edit - Show edit form */
    public function edit(Classroom $classroom)
    {
        $this->authorize('update', $classroom);

        return Inertia::render('Classrooms/Edit', [
            'classroom' => $classroom,
            'teachers' => $this->teacherOptions(),
        ]);
    }

    /** PUT /classrooms/{id} - Update classroom */
    public function update(UpdateClassroomRequest $request, Classroom $classroom)
    {
        $this->authorize('update', $classroom);

        $this->service->update($classroom, $request->validated());

        return redirect()->route('classrooms.index')
            ->with('success', 'Classroom updated successfully.');
    }

    /** DELETE /classrooms/{id} - Delete classroom */
    public function destroy(Classroom $classroom)
    {
        $this->authorize('delete', $classroom);

        $this->service->delete($classroom);

        return redirect()->route('classrooms.index')
            ->with('success', 'Classroom deleted successfully.');
    }

    /** POST /classrooms/batch-store - Create multiple classrooms */
    public function batchStore(Request $request)
    {
        $this->authorize('create', Classroom::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.name' => ['required', 'string', 'max:255', 'distinct', Rule::unique('classes', 'name')],
            'items.*.teacher_in_charge_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['items'] as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', count($validated['items']).' classrooms created successfully.');
    }

    /** POST /classrooms/batch-assign-teacher - Assign teacher for multiple classrooms */
    public function batchAssignTeacher(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:classes,id'],
            'teacher_in_charge_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $classrooms = $this->resolveBatchClassrooms($ids);
        $this->authorizeBatch($classrooms, 'update');

        $teacherId = $validated['teacher_in_charge_id'] ?? null;

        DB::transaction(function () use ($ids, $classrooms, $teacherId): void {
            foreach ($ids as $id) {
                $classroom = $classrooms->get($id);
                if (! $classroom instanceof Classroom) {
                    continue;
                }

                $this->service->update($classroom, [
                    'teacher_in_charge_id' => $teacherId,
                ]);
            }
        });

        return back()->with('success', count($ids).' classrooms updated successfully.');
    }

    /** POST /classrooms/batch-delete - Delete multiple classrooms */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:classes,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $classrooms = $this->resolveBatchClassrooms($ids);
        $this->authorizeBatch($classrooms, 'delete');

        DB::transaction(function () use ($ids, $classrooms): void {
            foreach ($ids as $id) {
                $classroom = $classrooms->get($id);
                if (! $classroom instanceof Classroom) {
                    continue;
                }

                $this->service->delete($classroom);
            }
        });

        return back()->with('success', count($ids).' classrooms deleted successfully.');
    }

    /** GET /classrooms/trashed - List trashed classrooms */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Classroom::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $teacherFilter = trim((string) $request->query('teacher_in_charge_id', ''));
        if ($teacherFilter !== '') {
            $params['filter']['teacher_in_charge_id'] = $teacherFilter;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapTeacherName($data);

        return Inertia::render('Classrooms/Trashed', [
            'classrooms' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /classrooms/{id}/restore - Restore classroom */
    public function restore($id)
    {
        $classroom = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $classroom);

        $this->service->restore((int) $id);

        return redirect()->route('classrooms.index')
            ->with('success', 'Classroom restored successfully.');
    }

    /** DELETE /classrooms/{id}/force - Force delete classroom */
    public function forceDelete($id)
    {
        $classroom = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $classroom);

        $this->service->forceDelete((int) $id);

        return redirect()->route('classrooms.trashed')
            ->with('success', 'Classroom permanently deleted.');
    }

    /** POST /classrooms/import - Import from file */
    public function import(ClassroomImportRequest $request)
    {
        $this->authorize('import', Classroom::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('classrooms.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /classrooms/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Classroom::class);

        return $this->service->exportCsv();
    }

    /** GET /classrooms/suggestions - Live search suggestions */
    public function suggestions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Classroom::class);

        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => $this->service->suggestions($query, 8),
        ]);
    }

    private function mapTeacherName(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (Classroom $classroom) {
                return [
                    'id' => $classroom->id,
                    'name' => $classroom->name,
                    'level' => $classroom->level,
                    'section' => $classroom->section,
                    'teacher_in_charge_id' => $classroom->teacher_in_charge_id,
                    'teacher_name' => $classroom->teacherInCharge?->name,
                    'created_at' => $classroom->created_at,
                    'updated_at' => $classroom->updated_at,
                    'deleted_at' => $classroom->deleted_at,
                ];
            })
        );
    }

    private function teacherOptions(): array
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
     * @return Collection<int, Classroom>
     */
    private function resolveBatchClassrooms(array $ids): Collection
    {
        return Classroom::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Classroom>  $classrooms
     */
    private function authorizeBatch(Collection $classrooms, string $ability): void
    {
        foreach ($classrooms as $classroom) {
            $this->authorize($ability, $classroom);
        }
    }
}
