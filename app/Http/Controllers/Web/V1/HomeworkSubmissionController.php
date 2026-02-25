<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\HomeworkSubmission\HomeworkSubmissionImportRequest;
use App\Http\Requests\HomeworkSubmission\StoreHomeworkSubmissionRequest;
use App\Http\Requests\HomeworkSubmission\UpdateHomeworkSubmissionRequest;
use App\Models\HomeworkSubmission;
use App\Services\HomeworkSubmissionService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeworkSubmissionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HomeworkSubmissionService $service) {}

    /** GET /homework-submissions - List all homework submissions */
    public function index(Request $request)
    {
        $this->authorize('viewAny', HomeworkSubmission::class);

        $data = $this->service->list($request->all());

        return Inertia::render('HomeworkSubmissions/Index', [
            'homeworkSubmissions' => $data,
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

        $homeworkSubmission = $this->service->store($request->validated());

        return redirect()->route('homework-submissions.show', $homeworkSubmission->id)
            ->with('success', 'Homework submission recorded successfully.');
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

        $updated = $this->service->update($homeworkSubmission, $request->validated());

        return redirect()->route('homework-submissions.show', $updated->id)
            ->with('success', 'Homework submission updated successfully.');
    }

    /** DELETE /homework-submissions/{id} - Delete homework submission */
    public function destroy(HomeworkSubmission $homeworkSubmission)
    {
        $this->authorize('delete', $homeworkSubmission);

        $this->service->delete($homeworkSubmission);

        return redirect()->route('homework-submissions.index')
            ->with('success', 'Homework submission deleted successfully.');
    }

    /** GET /homework-submissions/trashed - List trashed homework submissions */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', HomeworkSubmission::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('HomeworkSubmissions/Trashed', [
            'homeworkSubmissions' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /homework-submissions/{id}/restore - Restore homework submission */
    public function restore($id)
    {
        $homeworkSubmission = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $homeworkSubmission);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('homework-submissions.show', $restored->id)
            ->with('success', 'Homework submission restored successfully.');
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
}
