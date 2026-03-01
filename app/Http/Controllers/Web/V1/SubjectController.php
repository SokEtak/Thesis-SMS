<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subject\SubjectImportRequest;
use App\Http\Requests\Subject\SubjectStoreRequest;
use App\Http\Requests\Subject\SubjectUpdateRequest;
use App\Models\Subject;
use App\Services\SubjectService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SubjectController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private SubjectService $service) {}

    /** GET /subjects - List all subjects */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Subject::class);

        $params = $request->all();

        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $codeFilter = trim((string) $request->query('code', ''));
        if ($codeFilter !== '') {
            $params['filter']['code'] = $codeFilter;
        }

        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'name', 'code', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());

        return Inertia::render('Subjects/Index', [
            'subjects' => $data,
            'codes' => $this->codeOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /subjects/{id} - Show subject details */
    public function show(Subject $subject)
    {
        $this->authorize('view', $subject);

        $model = $this->service->show($subject);

        return Inertia::render('Subjects/Show', [
            'subject' => $model,
        ]);
    }

    /** GET /subjects/create - Show create form */
    public function create()
    {
        $this->authorize('create', Subject::class);

        return Inertia::render('Subjects/Create');
    }

    /** POST /subjects - Store new subject */
    public function store(SubjectStoreRequest $request)
    {
        $this->authorize('create', Subject::class);

        $this->service->store($request->validated());

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    /** POST /subjects/batch-store - Create multiple subjects */
    public function batchStore(Request $request)
    {
        $this->authorize('create', Subject::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.code' => ['required', 'string', 'max:20', 'distinct', 'unique:subjects,code'],
            'items.*.name' => ['required', 'string', 'max:255', 'distinct', 'unique:subjects,name'],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['items'] as $item) {
                $this->service->store([
                    'code' => trim((string) $item['code']),
                    'name' => trim((string) $item['name']),
                ]);
            }
        });

        return back()->with('success', count($validated['items']).' subjects created successfully.');
    }

    /** GET /subjects/{id}/edit - Show edit form */
    public function edit(Subject $subject)
    {
        $this->authorize('update', $subject);

        return Inertia::render('Subjects/Edit', [
            'subject' => $subject,
        ]);
    }

    /** PUT /subjects/{id} - Update subject */
    public function update(SubjectUpdateRequest $request, Subject $subject)
    {
        $this->authorize('update', $subject);

        $this->service->update($subject, $request->validated());

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    /** POST /subjects/batch-update - Update multiple subjects */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.id' => ['required', 'integer', 'distinct', 'exists:subjects,id'],
            'items.*.code' => ['required', 'string', 'max:20'],
            'items.*.name' => ['required', 'string', 'max:255'],
        ]);

        $items = $validated['items'];
        $normalizedCodes = array_map(static fn (array $item): string => Str::lower(trim((string) $item['code'])), $items);
        $normalizedNames = array_map(static fn (array $item): string => Str::lower(trim((string) $item['name'])), $items);

        if (count($normalizedCodes) !== count(array_unique($normalizedCodes))) {
            throw ValidationException::withMessages([
                'items' => 'Duplicate codes found in batch update rows.',
            ]);
        }

        if (count($normalizedNames) !== count(array_unique($normalizedNames))) {
            throw ValidationException::withMessages([
                'items' => 'Duplicate names found in batch update rows.',
            ]);
        }

        $ids = $this->sanitizeBatchIds(array_map(static fn (array $item): int => (int) $item['id'], $items));
        $subjects = $this->resolveBatchSubjects($ids);
        $this->authorizeBatch($subjects, 'update');

        DB::transaction(function () use ($items, $subjects): void {
            foreach ($items as $item) {
                $id = (int) $item['id'];
                $subject = $subjects->get($id);
                if (! $subject instanceof Subject) {
                    continue;
                }

                $payload = [
                    'code' => trim((string) $item['code']),
                    'name' => trim((string) $item['name']),
                ];

                Validator::make($payload, [
                    'code' => ['required', 'string', 'max:20', Rule::unique('subjects', 'code')->ignore($subject->id)],
                    'name' => ['required', 'string', 'max:255', Rule::unique('subjects', 'name')->ignore($subject->id)],
                ])->validate();

                $this->service->update($subject, $payload);
            }
        });

        return back()->with('success', count($items).' subjects updated successfully.');
    }

    /** DELETE /subjects/{id} - Delete subject */
    public function destroy(Subject $subject)
    {
        $this->authorize('delete', $subject);

        $this->service->delete($subject);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /** POST /subjects/batch-delete - Delete multiple subjects */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $subjects = $this->resolveBatchSubjects($ids);
        $this->authorizeBatch($subjects, 'delete');

        DB::transaction(function () use ($ids, $subjects): void {
            foreach ($ids as $id) {
                $subject = $subjects->get($id);
                if (! $subject instanceof Subject) {
                    continue;
                }

                $this->service->delete($subject);
            }
        });

        return back()->with('success', count($ids).' subjects deleted successfully.');
    }

    /** GET /subjects/trashed - List trashed subjects */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Subject::class);

        $params = $request->all();
        $params['trashed'] = 'only';
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $codeFilter = trim((string) $request->query('code', ''));
        if ($codeFilter !== '') {
            $params['filter']['code'] = $codeFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'name', 'code', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());

        return Inertia::render('Subjects/Trashed', [
            'subjects' => $data,
            'codes' => $this->codeOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /subjects/{id}/restore - Restore subject */
    public function restore($id)
    {
        $subject = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $subject);

        $this->service->restore((int) $id);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject restored successfully.');
    }

    /** POST /subjects/batch-restore - Restore multiple subjects */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $trashedSubjects = Subject::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($trashedSubjects as $subject) {
            $this->authorize('restore', $subject);
        }

        DB::transaction(function () use ($ids, $trashedSubjects): void {
            foreach ($ids as $id) {
                if (! $trashedSubjects->has($id)) {
                    continue;
                }

                $this->service->restore((int) $id);
            }
        });

        return back()->with('success', count($ids).' subjects restored successfully.');
    }

    /** DELETE /subjects/{id}/force - Force delete subject */
    public function forceDelete($id)
    {
        $subject = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $subject);

        $this->service->forceDelete((int) $id);

        return redirect()->route('subjects.trashed')
            ->with('success', 'Subject permanently deleted.');
    }

    /** POST /subjects/batch-force-delete - Permanently delete multiple subjects */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $trashedSubjects = Subject::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($trashedSubjects as $subject) {
            $this->authorize('forceDelete', $subject);
        }

        DB::transaction(function () use ($ids, $trashedSubjects): void {
            foreach ($ids as $id) {
                if (! $trashedSubjects->has($id)) {
                    continue;
                }

                $this->service->forceDelete((int) $id);
            }
        });

        return back()->with('success', count($ids).' subjects permanently deleted.');
    }

    /** POST /subjects/import - Import from file */
    public function import(SubjectImportRequest $request)
    {
        $this->authorize('import', Subject::class);

        $file = $request->file('file');
        $this->service->importSubjects($file);

        return redirect()->route('subjects.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /subjects/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Subject::class);

        return $this->service->exportCsv();
    }

    /** GET /subjects/suggestions - Live search suggestions */
    public function suggestions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Subject::class);

        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            return response()->json(['data' => []]);
        }

        $rows = Subject::query()
            ->select(['id', 'name', 'code'])
            ->where(function (Builder $builder) use ($query): void {
                $this->applyCaseInsensitiveContains($builder, 'name', $query);
                $builder->orWhere(function (Builder $codeQuery) use ($query): void {
                    $this->applyCaseInsensitiveContains($codeQuery, 'code', $query);
                });
            })
            ->orderBy('name')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => $rows->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
            ])->values(),
        ]);
    }

    private function applyCaseInsensitiveContains(Builder $query, string $column, string $term): void
    {
        $wrappedColumn = $query->getQuery()->getGrammar()->wrap($column);
        $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.Str::lower($term).'%']);
    }

    /**
     * @param  int[]  $ids
     * @return int[]
     */
    private function sanitizeBatchIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    /**
     * @param  int[]  $ids
     * @return Collection<int, Subject>
     */
    private function resolveBatchSubjects(array $ids): Collection
    {
        return Subject::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Subject>  $subjects
     */
    private function authorizeBatch(Collection $subjects, string $ability): void
    {
        foreach ($subjects as $subject) {
            $this->authorize($ability, $subject);
        }
    }

    /**
     * @return string[]
     */
    private function codeOptions(): array
    {
        return Subject::query()
            ->select('code')
            ->orderBy('code')
            ->limit(500)
            ->pluck('code')
            ->filter(fn ($code): bool => is_string($code) && trim($code) !== '')
            ->values()
            ->all();
    }
}
