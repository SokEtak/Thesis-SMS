<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\AttendanceImportRequest;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Models\Attendance;
use App\Services\AttendanceService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AttendanceService $service) {}

    /** GET /attendances - List all attendances */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Attendances/Index', [
            'attendances' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /attendances/{id} - Show attendance details */
    public function show(Attendance $attendance)
    {
        $this->authorize('view', $attendance);

        $model = $this->service->show($attendance);

        return Inertia::render('Attendances/Show', [
            'attendance' => $model,
        ]);
    }

    /** GET /attendances/create - Show create form */
    public function create()
    {
        $this->authorize('create', Attendance::class);

        return Inertia::render('Attendances/Create');
    }

    /** POST /attendances - Store new attendance */
    public function store(StoreAttendanceRequest $request)
    {
        $this->authorize('create', Attendance::class);

        $attendance = $this->service->store($request->validated());

        return redirect()->route('attendances.show', $attendance->id)
            ->with('success', 'Attendance recorded successfully.');
    }

    /** GET /attendances/{id}/edit - Show edit form */
    public function edit(Attendance $attendance)
    {
        $this->authorize('update', $attendance);

        return Inertia::render('Attendances/Edit', [
            'attendance' => $attendance,
        ]);
    }

    /** PUT /attendances/{id} - Update attendance */
    public function update(UpdateAttendanceRequest $request, Attendance $attendance)
    {
        $this->authorize('update', $attendance);

        $updated = $this->service->update($attendance, $request->validated());

        return redirect()->route('attendances.show', $updated->id)
            ->with('success', 'Attendance updated successfully.');
    }

    /** DELETE /attendances/{id} - Delete attendance */
    public function destroy(Attendance $attendance)
    {
        $this->authorize('delete', $attendance);

        $this->service->delete($attendance);

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance deleted successfully.');
    }

    /** GET /attendances/trashed - List trashed attendances */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('Attendances/Trashed', [
            'attendances' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /attendances/{id}/restore - Restore attendance */
    public function restore($id)
    {
        $attendance = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $attendance);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('attendances.show', $restored->id)
            ->with('success', 'Attendance restored successfully.');
    }

    /** DELETE /attendances/{id}/force - Force delete attendance */
    public function forceDelete($id)
    {
        $attendance = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $attendance);

        $this->service->forceDelete((int) $id);

        return redirect()->route('attendances.trashed')
            ->with('success', 'Attendance permanently deleted.');
    }

    /** POST /attendances/import - Import from file */
    public function import(AttendanceImportRequest $request)
    {
        $this->authorize('import', Attendance::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('attendances.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /attendances/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Attendance::class);

        return $this->service->exportCsv();
    }
}
