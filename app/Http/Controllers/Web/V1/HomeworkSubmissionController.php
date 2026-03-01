<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\HomeworkSubmission\HomeworkSubmissionImportRequest;
use App\Http\Requests\HomeworkSubmission\StoreHomeworkSubmissionRequest;
use App\Http\Requests\HomeworkSubmission\UpdateHomeworkSubmissionRequest;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\User;
use App\Services\HomeworkSubmissionService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HomeworkSubmissionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HomeworkSubmissionService $service) {}

    /** GET /homework-submissions - List all homework submissions */
    public function index(Request $request)
    {
        $this->authorize('viewAny', HomeworkSubmission::class);

        $params = $request->all();
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $homeworkFilter = trim((string) $request->query('homework_id', ''));
        if ($homeworkFilter !== '') {
            $params['filter']['homework_id'] = $homeworkFilter;
        }
        $studentFilter = trim((string) $request->query('student_id', ''));
        if ($studentFilter !== '') {
            $params['filter']['student_id'] = $studentFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'submitted_at', 'score', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapHomeworkSubmissionRows($data);

        return Inertia::render('HomeworkSubmissions/Index', [
            'homeworkSubmissions' => $data,
            'homeworks' => $this->homeworkOptions(),
            'students' => $this->studentOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /homework-submissions/{id} - Show homework submission details */
    public function show(HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('view', $homeworkSubmission);

        $model = $this->service->show($homeworkSubmission);

        return Inertia::render('HomeworkSubmissions/Show', [
            'homeworkSubmission' => $model,
        ]);
    }

    /** GET /homework-submissions/create - Show create form */
    public function create()
    {
        $this->authorize('create', HomeworkSubmission::class);

        return Inertia::render('HomeworkSubmissions/Create');
    }

    /** POST /homework-submissions - Store new homework submission */
    public function store(StoreHomeworkSubmissionRequest $request)
    {
        $this->authorize('create', HomeworkSubmission::class);

        $this->service->store($request->validated());

        return redirect()->route('homework-submissions.index')
            ->with('success', 'Homework submission recorded successfully.');
    }

    /** POST /homework-submissions/batch-store - Store multiple homework submissions */
    public function batchStore(Request $request)
    {
        $this->authorize('create', HomeworkSubmission::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.homework_id' => ['required', 'integer', 'exists:homework,id'],
            'items.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.file_url' => ['nullable', 'string', 'max:255'],
            'items.*.submitted_at' => ['nullable', 'date'],
            'items.*.score' => ['nullable', 'integer'],
            'items.*.feedback' => ['nullable', 'string'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'homework_id' => (int) $item['homework_id'],
                'student_id' => (int) $item['student_id'],
                'file_url' => $item['file_url'] ?? null,
                'submitted_at' => $item['submitted_at'] ?? null,
                'score' => $item['score'] ?? null,
                'feedback' => $item['feedback'] ?? null,
            ])
            ->values();

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' homework submission records created successfully.');
    }

    /** GET /homework-submissions/{id}/edit - Show edit form */
    public function edit(HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('update', $homeworkSubmission);

        return Inertia::render('HomeworkSubmissions/Edit', [
            'homeworkSubmission' => $homeworkSubmission,
        ]);
    }

    /** PUT /homework-submissions/{id} - Update homework submission */
    public function update(UpdateHomeworkSubmissionRequest $request, HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('update', $homeworkSubmission);

        $this->service->update($homeworkSubmission, $request->validated());

        return redirect()->route('homework-submissions.index')
            ->with('success', 'Homework submission updated successfully.');
    }

    /** POST /homework-submissions/batch-update - Update selected homework submission rows */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homework_submissions,id'],
            'score' => ['sometimes', 'nullable', 'integer'],
            'feedback' => ['sometimes', 'nullable', 'string'],
        ]);

        $updates = [];
        if (array_key_exists('score', $validated)) {
            $updates['score'] = $validated['score'];
        }
        if (array_key_exists('feedback', $validated)) {
            $updates['feedback'] = $validated['feedback'];
        }

        if ($updates === []) {
            return back()->withErrors([
                'updates' => 'Provide at least one field to update.',
            ]);
        }

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'update');

        DB::transaction(function () use ($ids, $rows, $updates): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof HomeworkSubmission) {
                    continue;
                }

                $this->service->update($row, $updates);
            }
        });

        return back()->with('success', count($ids).' homework submission records updated successfully.');
    }

    /** DELETE /homework-submissions/{id} - Delete homework submission */
    public function destroy(HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('delete', $homeworkSubmission);

        $this->service->delete($homeworkSubmission);

        return redirect()->route('homework-submissions.index')
            ->with('success', 'Homework submission deleted successfully.');
    }

    /** POST /homework-submissions/batch-delete - Delete multiple homework submissions */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homework_submissions,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'delete');

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof HomeworkSubmission) {
                    continue;
                }

                $this->service->delete($row);
            }
        });

        return back()->with('success', count($ids).' homework submission records deleted successfully.');
    }

    /** GET /homework-submissions/trashed - List trashed homework submissions */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', HomeworkSubmission::class);

        $params = $request->all();
        $params['trashed'] = 'only';
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $homeworkFilter = trim((string) $request->query('homework_id', ''));
        if ($homeworkFilter !== '') {
            $params['filter']['homework_id'] = $homeworkFilter;
        }
        $studentFilter = trim((string) $request->query('student_id', ''));
        if ($studentFilter !== '') {
            $params['filter']['student_id'] = $studentFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'submitted_at', 'score', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapHomeworkSubmissionRows($data);

        return Inertia::render('HomeworkSubmissions/Trashed', [
            'homeworkSubmissions' => $data,
            'homeworks' => $this->homeworkOptions(),
            'students' => $this->studentOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /homework-submissions/{id}/restore - Restore homework submission */
    public function restore($id)
    {
        $homeworkSubmission = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $homeworkSubmission);

        $this->service->restore((int) $id);

        return redirect()->route('homework-submissions.trashed')
            ->with('success', 'Homework submission restored successfully.');
    }

    /** POST /homework-submissions/batch-restore - Restore multiple homework submissions */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homework_submissions,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = HomeworkSubmission::onlyTrashed()
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

        return back()->with('success', count($ids).' homework submission records restored successfully.');
    }

    /** DELETE /homework-submissions/{id}/force - Force delete homework submission */
    public function forceDelete($id)
    {
        $homeworkSubmission = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $homeworkSubmission);

        $this->service->forceDelete((int) $id);

        return redirect()->route('homework-submissions.trashed')
            ->with('success', 'Homework submission permanently deleted.');
    }

    /** POST /homework-submissions/batch-force-delete - Permanently delete multiple homework submissions */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:homework_submissions,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = HomeworkSubmission::onlyTrashed()
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

        return back()->with('success', count($ids).' homework submission records permanently deleted.');
    }

    /** POST /homework-submissions/import - Import from file */
    public function import(HomeworkSubmissionImportRequest $request)
    {
        $this->authorize('import', HomeworkSubmission::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('homework-submissions.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /homework-submissions/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', HomeworkSubmission::class);

        return $this->service->exportCsv();
    }

    private function mapHomeworkSubmissionRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (HomeworkSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'homework_id' => $submission->homework_id,
                    'homework_title' => $submission->homework?->title,
                    'student_id' => $submission->student_id,
                    'student_name' => $submission->student?->name,
                    'file_url' => $submission->file_url,
                    'submitted_at' => $submission->submitted_at?->toDateTimeString(),
                    'score' => $submission->score,
                    'feedback' => $submission->feedback,
                    'created_at' => $submission->created_at,
                    'updated_at' => $submission->updated_at,
                    'deleted_at' => $submission->deleted_at,
                ];
            })
        );
    }

    private function homeworkOptions(): array
    {
        return Homework::query()
            ->select(['id', 'title'])
            ->orderBy('title')
            ->limit(500)
            ->get()
            ->map(fn (Homework $homework) => [
                'id' => $homework->id,
                'name' => $homework->title,
            ])
            ->values()
            ->all();
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

    private function sanitizeBatchIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    /**
     * @param  int[]  $ids
     * @return Collection<int, HomeworkSubmission>
     */
    private function resolveBatchRows(array $ids): Collection
    {
        return HomeworkSubmission::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, HomeworkSubmission>  $rows
     */
    private function authorizeBatch(Collection $rows, string $ability): void
    {
        foreach ($rows as $row) {
            $this->authorize($ability, $row);
        }
    }
}
