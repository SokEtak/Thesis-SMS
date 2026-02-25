<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Message\MessageImportRequest;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Requests\Message\UpdateMessageRequest;
use App\Models\Message;
use App\Services\MessageService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessageController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private MessageService $service) {}

    /** GET /messages - List all messages */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Message::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Messages/Index', [
            'messages' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /messages/{id} - Show message details */
    public function show(Message $message)
    {
        $this->authorize('view', $message);

        $model = $this->service->show($message);

        return Inertia::render('Messages/Show', [
            'message' => $model,
        ]);
    }

    /** GET /messages/create - Show create form */
    public function create()
    {
        $this->authorize('create', Message::class);

        return Inertia::render('Messages/Create');
    }

    /** POST /messages - Store new message */
    public function store(StoreMessageRequest $request)
    {
        $this->authorize('create', Message::class);

        $message = $this->service->store($request->validated());

        return redirect()->route('messages.show', $message->id)
            ->with('success', 'Message sent successfully.');
    }

    /** GET /messages/{id}/edit - Show edit form */
    public function edit(Message $message)
    {
        $this->authorize('update', $message);

        return Inertia::render('Messages/Edit', [
            'message' => $message,
        ]);
    }

    /** PUT /messages/{id} - Update message */
    public function update(UpdateMessageRequest $request, Message $message)
    {
        $this->authorize('update', $message);

        $updated = $this->service->update($message, $request->validated());

        return redirect()->route('messages.show', $updated->id)
            ->with('success', 'Message updated successfully.');
    }

    /** DELETE /messages/{id} - Delete message */
    public function destroy(Message $message)
    {
        $this->authorize('delete', $message);

        $this->service->delete($message);

        return redirect()->route('messages.index')
            ->with('success', 'Message deleted successfully.');
    }

    /** GET /messages/trashed - List trashed messages */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Message::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('Messages/Trashed', [
            'messages' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /messages/{id}/restore - Restore message */
    public function restore($id)
    {
        $message = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $message);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('messages.show', $restored->id)
            ->with('success', 'Message restored successfully.');
    }

    /** DELETE /messages/{id}/force - Force delete message */
    public function forceDelete($id)
    {
        $message = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $message);

        $this->service->forceDelete((int) $id);

        return redirect()->route('messages.trashed')
            ->with('success', 'Message permanently deleted.');
    }

    /** POST /messages/import - Import from file */
    public function import(MessageImportRequest $request)
    {
        $this->authorize('import', Message::class);

        $file = $request->file('file');

        $this->service->import($file);

        return redirect()->route('messages.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /messages/export - Export to CSV */
    public function exportCsv()
    {
        $this->authorize('export', Message::class);

        return $this->service->exportCsv();
    }
}
