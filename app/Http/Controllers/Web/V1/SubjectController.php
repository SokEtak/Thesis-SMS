<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subject\SubjectImportRequest;
use App\Http\Requests\Subject\SubjectStoreRequest;
use App\Http\Requests\Subject\SubjectUpdateRequest;
use App\Models\Subject;
use App\Services\SubjectService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private SubjectService $service) {}

    /** GET /subjects - List all subjects */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Subject::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Subjects/Index', [
            'subjects' => $data,
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

        $subject = $this->service->store($request->validated());

        return redirect()->route('subjects.show', $subject->id)
            ->with('success', 'Subject created successfully.');
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

        $updated = $this->service->update($subject, $request->validated());

        return redirect()->route('subjects.show', $updated->id)
            ->with('success', 'Subject updated successfully.');
    }

    /** DELETE /subjects/{id} - Delete subject */
    public function destroy(Subject $subject)
    {
        $this->authorize('delete', $subject);

        $this->service->delete($subject);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /** GET /subjects/trashed - List trashed subjects */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Subject::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('Subjects/Trashed', [
            'subjects' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /subjects/{id}/restore - Restore subject */
    public function restore($id)
    {
        $subject = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $subject);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('subjects.show', $restored->id)
            ->with('success', 'Subject restored successfully.');
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
}
