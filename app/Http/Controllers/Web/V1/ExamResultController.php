<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamResult\ExamResultImportRequest;
use App\Http\Requests\ExamResult\StoreExamResultRequest;
use App\Http\Requests\ExamResult\UpdateExamResultRequest;
use App\Models\ExamResult;
use App\Models\Subject;
use App\Models\User;
use App\Services\ExamResultService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExamResultController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ExamResultService $service) {}

    /** GET /exam-results - List all exam results */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ExamResult::class);

        $params = $request->all();
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $studentFilter = trim((string) $request->query('student_id', ''));
        if ($studentFilter !== '') {
            $params['filter']['student_id'] = $studentFilter;
        }
        $subjectFilter = trim((string) $request->query('subject_id', ''));
        if ($subjectFilter !== '') {
            $params['filter']['subject_id'] = $subjectFilter;
        }
        $typeFilter = trim((string) $request->query('exam_type', ''));
        if ($typeFilter !== '') {
            $params['filter']['exam_type'] = $typeFilter;
        }
        $statusFilter = trim((string) $request->query('status', ''));
        if ($statusFilter !== '') {
            $params['filter']['status'] = $statusFilter;
        }

        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'exam_type', 'exam_date', 'score', 'status', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapExamResultRows($data);

        return Inertia::render('ExamResults/Index', [
            'examResults' => $data,
            'students' => $this->studentOptions(),
            'subjects' => $this->subjectOptions(),
            'recorders' => $this->recorderOptions(),
            'examTypes' => $this->examTypeOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /exam-results/{id} - Show exam result details */
    public function show(ExamResult $examResult)
    {
        $this->authorize('view', $examResult);

        $model = $this->service->show($examResult);

        return Inertia::render('ExamResults/Show', [
            'examResult' => $model,
        ]);
    }

    /** GET /exam-results/create - Show create form */
    public function create()
    {
        $this->authorize('create', ExamResult::class);

        return Inertia::render('ExamResults/Create');
    }

    /** POST /exam-results - Store new exam result */
    public function store(StoreExamResultRequest $request)
    {
        $this->authorize('create', ExamResult::class);

        $examResult = $this->service->store($request->validated());

        return redirect()->route('exam-results.index')
            ->with('success', 'Exam result recorded successfully.');
    }

    /** POST /exam-results/batch-store - Store multiple exam results */
    public function batchStore(Request $request)
    {
        $this->authorize('create', ExamResult::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'items.*.exam_type' => ['required', 'in:quiz,monthly,semester,midterm,final'],
            'items.*.exam_date' => ['required', 'date'],
            'items.*.score' => ['nullable', 'integer', 'min:1', 'max:125'],
            'items.*.recorded_by' => ['nullable', 'integer', 'exists:users,id'],
            'items.*.remark' => ['nullable', 'string'],
            'items.*.status' => ['required', 'in:draft,final'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'student_id' => (int) $item['student_id'],
                'subject_id' => (int) $item['subject_id'],
                'exam_type' => trim((string) $item['exam_type']),
                'exam_date' => (string) $item['exam_date'],
                'score' => $item['score'] ?? null,
                'recorded_by' => $item['recorded_by'] ?? null,
                'remark' => $item['remark'] ?? null,
                'status' => (string) $item['status'],
            ])
            ->values();

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' exam result records created successfully.');
    }

    /** GET /exam-results/{id}/edit - Show edit form */
    public function edit(ExamResult $examResult)
    {
        $this->authorize('update', $examResult);

        return Inertia::render('ExamResults/Edit', [
            'examResult' => $examResult,
            'recorders' => $this->recorderOptions(),
        ]);
    }

    /** PUT /exam-results/{id} - Update exam result */
    public function update(UpdateExamResultRequest $request, ExamResult $examResult)
    {
        $this->authorize('update', $examResult);

        $updated = $this->service->update($examResult, $request->validated());

        return redirect()->route('exam-results.index')
            ->with('success', 'Exam result updated successfully.');
    }

    /** POST /exam-results/batch-update - Update selected exam result rows */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:exam_results,id'],
            'status' => ['required', 'in:draft,final'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'update');

        DB::transaction(function () use ($ids, $rows, $validated): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof ExamResult) {
                    continue;
                }

                $this->service->update($row, [
                    'status' => $validated['status'],
                ]);
            }
        });

        return back()->with('success', count($ids).' exam result records updated successfully.');
    }

    /** DELETE /exam-results/{id} - Delete exam result */
    public function destroy(ExamResult $examResult)
    {
        $this->authorize('delete', $examResult);

        $this->service->delete($examResult);

        return redirect()->route('exam-results.index')
            ->with('success', 'Exam result deleted successfully.');
    }

    /** POST /exam-results/batch-delete - Delete multiple exam results */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:exam_results,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'delete');

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof ExamResult) {
                    continue;
                }

                $this->service->delete($row);
            }
        });

        return back()->with('success', count($ids).' exam result records deleted successfully.');
    }

    /** GET /exam-results/trashed - List trashed exam results */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', ExamResult::class);

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
        $subjectFilter = trim((string) $request->query('subject_id', ''));
        if ($subjectFilter !== '') {
            $params['filter']['subject_id'] = $subjectFilter;
        }
        $typeFilter = trim((string) $request->query('exam_type', ''));
        if ($typeFilter !== '') {
            $params['filter']['exam_type'] = $typeFilter;
        }
        $statusFilter = trim((string) $request->query('status', ''));
        if ($statusFilter !== '') {
            $params['filter']['status'] = $statusFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'exam_type', 'exam_date', 'score', 'status', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapExamResultRows($data);

        return Inertia::render('ExamResults/Trashed', [
            'examResults' => $data,
            'students' => $this->studentOptions(),
            'subjects' => $this->subjectOptions(),
            'recorders' => $this->recorderOptions(),
            'examTypes' => $this->examTypeOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /exam-results/{id}/restore - Restore exam result */
    public function restore($id)
    {
        $examResult = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $examResult);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('exam-results.show', $restored->id)
            ->with('success', 'Exam result restored successfully.');
    }

    /** POST /exam-results/batch-restore - Restore multiple exam results */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:exam_results,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = ExamResult::onlyTrashed()
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

        return back()->with('success', count($ids).' exam result records restored successfully.');
    }

    /** DELETE /exam-results/{id}/force - Force delete exam result */
    public function forceDelete($id)
    {
        $examResult = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $examResult);

        $this->service->forceDelete((int) $id);

        return redirect()->route('exam-results.trashed')
            ->with('success', 'Exam result permanently deleted.');
    }

    /** POST /exam-results/batch-force-delete - Permanently delete multiple exam results */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:exam_results,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = ExamResult::onlyTrashed()
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

        return back()->with('success', count($ids).' exam result records permanently deleted.');
    }

    /** POST /exam-results/import - Import from file */
    public function import(ExamResultImportRequest $request)
    {
        $this->authorize('import', ExamResult::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('exam-results.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /exam-results/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', ExamResult::class);

        return $this->service->exportCsv();
    }

    private function mapExamResultRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (ExamResult $examResult) {
                return [
                    'id' => $examResult->id,
                    'student_id' => $examResult->student_id,
                    'student_name' => $examResult->student?->name,
                    'subject_id' => $examResult->subject_id,
                    'subject_name' => $examResult->subject?->name,
                    'exam_type' => $examResult->exam_type,
                    'exam_date' => $examResult->exam_date?->toDateString(),
                    'score' => $examResult->score,
                    'status' => $examResult->status,
                    'remark' => $examResult->remark,
                    'recorded_by' => $examResult->recorded_by,
                    'recorded_by_name' => $examResult->recordedBy?->name,
                    'created_at' => $examResult->created_at,
                    'updated_at' => $examResult->updated_at,
                    'deleted_at' => $examResult->deleted_at,
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
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
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

    private function examTypeOptions(): array
    {
        return ['quiz', 'monthly', 'semester', 'midterm', 'final'];
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
     * @return Collection<int, ExamResult>
     */
    private function resolveBatchRows(array $ids): Collection
    {
        return ExamResult::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, ExamResult>  $rows
     */
    private function authorizeBatch(Collection $rows, string $ability): void
    {
        foreach ($rows as $row) {
            $this->authorize($ability, $row);
        }
    }
}
