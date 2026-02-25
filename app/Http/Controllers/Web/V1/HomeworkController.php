<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Homework\HomeworkImportRequest;
use App\Http\Requests\Homework\StoreHomeworkRequest;
use App\Http\Requests\Homework\UpdateHomeworkRequest;
use App\Models\Homework;
use App\Services\HomeworkService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeworkController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HomeworkService $service) {}

    /** GET /homeworks - List all homeworks */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Homework::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Homeworks/Index', [
            'homeworks' => $data,
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

        $homework = $this->service->store($data);

        return redirect()->route('homeworks.show', $homework->id)
            ->with('success', 'Homework created successfully.');
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

    /** DELETE /homeworks/{id} - Delete homework */
    public function destroy(Homework $homework)
    {
        $this->authorize('delete', $homework);

        $this->service->delete($homework);

        return redirect()->route('homeworks.index')
            ->with('success', 'Homework deleted successfully.');
    }

    /** GET /homeworks/trashed - List trashed homeworks */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Homework::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('Homeworks/Trashed', [
            'homeworks' => $data,
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

    /** DELETE /homeworks/{id}/force - Force delete homework */
    public function forceDelete($id)
    {
        $homework = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $homework);

        $this->service->forceDelete((int) $id);

        return redirect()->route('homeworks.trashed')
            ->with('success', 'Homework permanently deleted.');
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
}
