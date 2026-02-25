<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Timetable\StoreTimetableRequest;
use App\Http\Requests\Timetable\TimetableImportRequest;
use App\Http\Requests\Timetable\UpdateTimetableRequest;
use App\Models\Timetable;
use App\Services\TimetableService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimetableController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private TimetableService $service) {}

    /** GET /timetables - List all timetables */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Timetable::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Timetables/Index', [
            'timetables' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /timetables/{id} - Show timetable details */
    public function show(Timetable $timetable)
    {
        $this->authorize('view', $timetable);

        $model = $this->service->show($timetable);

        return Inertia::render('Timetables/Show', [
            'timetable' => $model,
        ]);
    }

    /** GET /timetables/create - Show create form */
    public function create()
    {
        $this->authorize('create', Timetable::class);

        return Inertia::render('Timetables/Create');
    }

    /** POST /timetables - Store new timetable */
    public function store(StoreTimetableRequest $request)
    {
        $this->authorize('create', Timetable::class);

        $timetable = $this->service->store($request->validated());

        return redirect()->route('timetables.show', $timetable->id)
            ->with('success', 'Timetable created successfully.');
    }

    /** GET /timetables/{id}/edit - Show edit form */
    public function edit(Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        return Inertia::render('Timetables/Edit', [
            'timetable' => $timetable,
        ]);
    }

    /** PUT /timetables/{id} - Update timetable */
    public function update(UpdateTimetableRequest $request, Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        $updated = $this->service->update($timetable, $request->validated());

        return redirect()->route('timetables.show', $updated->id)
            ->with('success', 'Timetable updated successfully.');
    }

    /** DELETE /timetables/{id} - Delete timetable */
    public function destroy(Timetable $timetable)
    {
        $this->authorize('delete', $timetable);

        $this->service->delete($timetable);

        return redirect()->route('timetables.index')
            ->with('success', 'Timetable deleted successfully.');
    }

    /** GET /timetables/trashed - List trashed timetables */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Timetable::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('Timetables/Trashed', [
            'timetables' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /timetables/{id}/restore - Restore timetable */
    public function restore($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $timetable);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('timetables.show', $restored->id)
            ->with('success', 'Timetable restored successfully.');
    }

    /** DELETE /timetables/{id}/force - Force delete timetable */
    public function forceDelete($id)
    {
        $timetable = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $timetable);

        $this->service->forceDelete((int) $id);

        return redirect()->route('timetables.trashed')
            ->with('success', 'Timetable permanently deleted.');
    }

    /** POST /timetables/import - Import from file */
    public function import(TimetableImportRequest $request)
    {
        $this->authorize('import', Timetable::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('timetables.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /timetables/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Timetable::class);

        return $this->service->exportCsv();
    }
}
