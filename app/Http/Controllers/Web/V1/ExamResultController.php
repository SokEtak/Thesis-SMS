<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamResult\ExamResultImportRequest;
use App\Http\Requests\ExamResult\StoreExamResultRequest;
use App\Http\Requests\ExamResult\UpdateExamResultRequest;
use App\Models\ExamResult;
use App\Services\ExamResultService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamResultController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ExamResultService $service) {}

    /** GET /exam-results - List all exam results */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ExamResult::class);

        $data = $this->service->list($request->all());

        return Inertia::render('ExamResults/Index', [
            'examResults' => $data,
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

        return redirect()->route('exam-results.show', $examResult->id)
            ->with('success', 'Exam result recorded successfully.');
    }

    /** GET /exam-results/{id}/edit - Show edit form */
    public function edit(ExamResult $examResult)
    {
        $this->authorize('update', $examResult);

        return Inertia::render('ExamResults/Edit', [
            'examResult' => $examResult,
        ]);
    }

    /** PUT /exam-results/{id} - Update exam result */
    public function update(UpdateExamResultRequest $request, ExamResult $examResult)
    {
        $this->authorize('update', $examResult);

        $updated = $this->service->update($examResult, $request->validated());

        return redirect()->route('exam-results.show', $updated->id)
            ->with('success', 'Exam result updated successfully.');
    }

    /** DELETE /exam-results/{id} - Delete exam result */
    public function destroy(ExamResult $examResult)
    {
        $this->authorize('delete', $examResult);

        $this->service->delete($examResult);

        return redirect()->route('exam-results.index')
            ->with('success', 'Exam result deleted successfully.');
    }

    /** GET /exam-results/trashed - List trashed exam results */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', ExamResult::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('ExamResults/Trashed', [
            'examResults' => $data,
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

    /** DELETE /exam-results/{id}/force - Force delete exam result */
    public function forceDelete($id)
    {
        $examResult = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $examResult);

        $this->service->forceDelete((int) $id);

        return redirect()->route('exam-results.trashed')
            ->with('success', 'Exam result permanently deleted.');
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
}
