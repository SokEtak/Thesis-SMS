<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Classroom\ClassroomImportRequest;
use App\Http\Requests\Classroom\StoreClassroomRequest;
use App\Http\Requests\Classroom\UpdateClassroomRequest;
use App\Models\Classroom;
use App\Services\ClassroomService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassroomController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ClassroomService $service) {}

    /** GET /classrooms - List all classrooms */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Classroom::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Classrooms/Index', [
            'classrooms' => $data,
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

        return Inertia::render('Classrooms/Create');
    }

    /** POST /classrooms - Store new classroom */
    public function store(StoreClassroomRequest $request)
    {
        $this->authorize('create', Classroom::class);

        $classroom = $this->service->store($request->validated());

        return redirect()->route('classrooms.show', $classroom->id)
            ->with('success', 'Classroom created successfully.');
    }

    /** GET /classrooms/{id}/edit - Show edit form */
    public function edit(Classroom $classroom)
    {
        $this->authorize('update', $classroom);

        return Inertia::render('Classrooms/Edit', [
            'classroom' => $classroom,
        ]);
    }

    /** PUT /classrooms/{id} - Update classroom */
    public function update(UpdateClassroomRequest $request, Classroom $classroom)
    {
        $this->authorize('update', $classroom);

        $updated = $this->service->update($classroom, $request->validated());

        return redirect()->route('classrooms.show', $updated->id)
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

    /** GET /classrooms/trashed - List trashed classrooms */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Classroom::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

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

        $restored = $this->service->restore((int) $id);

        return redirect()->route('classrooms.show', $restored->id)
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
}
