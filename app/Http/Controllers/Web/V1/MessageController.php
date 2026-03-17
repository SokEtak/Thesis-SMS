<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Message\MessageImportRequest;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Requests\Message\UpdateMessageRequest;
use App\Models\Message;
use App\Models\User;
use App\Services\MessageService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MessageController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private MessageService $service) {}

    /** GET /messages - List all messages */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Message::class);

        $params = $request->all();
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $senderFilter = trim((string) $request->query('sender_id', ''));
        if ($senderFilter !== '') {
            $params['filter']['sender_id'] = $senderFilter;
        }
        $receiverFilter = trim((string) $request->query('receiver_id', ''));
        if ($receiverFilter !== '') {
            $params['filter']['receiver_id'] = $receiverFilter;
        }
        $readFilter = trim((string) $request->query('is_read', ''));
        if ($readFilter !== '') {
            $params['filter']['is_read'] = $readFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'is_read', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapMessageRows($data);

        return Inertia::render('Messages/Index', [
            'messages' => $data,
            'users' => $this->userOptions(),
            'query' => $request->all(),
            'can' => [
                'create' => $request->user()?->can('create', Message::class) ?? false,
            ],
        ]);
    }

    /** GET /messages/{id} - Show message details */
    public function show(Message $message)
    {
        $this->authorize('view', $message);

        $model = $this->service->show($message);
        $model->loadMissing([
            'sender:id,name,email',
            'receiver:id,name,email',
        ]);

        return Inertia::render('Messages/Show', [
            'message' => $model,
        ]);
    }

    /** GET /messages/create - Show create form */
    public function create()
    {
        $this->authorize('create', Message::class);

        return Inertia::render('Messages/Create', [
            'users' => $this->userOptions(),
        ]);
    }

    /** POST /messages - Store new message */
    public function store(StoreMessageRequest $request)
    {
        $this->authorize('create', Message::class);

        $actor = $request->user();
        abort_if($actor === null, 403);

        $payload = $request->validated();
        $payload['sender_id'] = $actor->id;
        $payload['is_read'] = false;

        $this->service->store($payload);

        return redirect()->route('messages.index')
            ->with('success', 'Message sent successfully.');
    }

    /** POST /messages/batch-store - Store multiple messages */
    public function batchStore(Request $request)
    {
        $this->authorize('create', Message::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.sender_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.receiver_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.message_body' => ['nullable', 'string'],
            'items.*.is_read' => ['nullable', 'boolean'],
        ]);

        $items = collect($validated['items'])
            ->map(fn (array $item) => [
                'sender_id' => (int) $item['sender_id'],
                'receiver_id' => (int) $item['receiver_id'],
                'message_body' => $item['message_body'] ?? null,
                'is_read' => (bool) ($item['is_read'] ?? false),
            ])
            ->values();

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                $this->service->store($item);
            }
        });

        return back()->with('success', $items->count().' messages created successfully.');
    }

    /** GET /messages/{id}/edit - Show edit form */
    public function edit(Message $message)
    {
        $this->authorize('update', $message);

        return Inertia::render('Messages/Edit', [
            'message' => $message,
            'users' => $this->userOptions(),
        ]);
    }

    /** PUT /messages/{id} - Update message */
    public function update(UpdateMessageRequest $request, Message $message)
    {
        $this->authorize('update', $message);

        $this->service->update($message, $request->validated());

        return redirect()->route('messages.index')
            ->with('success', 'Message updated successfully.');
    }

    /** POST /messages/batch-update - Update selected messages */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:messages,id'],
            'is_read' => ['required', 'boolean'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'update');

        DB::transaction(function () use ($ids, $rows, $validated): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof Message) {
                    continue;
                }

                $this->service->update($row, [
                    'is_read' => (bool) $validated['is_read'],
                ]);
            }
        });

        return back()->with('success', count($ids).' messages updated successfully.');
    }

    /** DELETE /messages/{id} - Delete message */
    public function destroy(Message $message)
    {
        $this->authorize('delete', $message);

        $this->service->delete($message);

        return redirect()->route('messages.index')
            ->with('success', 'Message deleted successfully.');
    }

    /** POST /messages/batch-delete - Delete multiple messages */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:messages,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = $this->resolveBatchRows($ids);
        $this->authorizeBatch($rows, 'delete');

        DB::transaction(function () use ($ids, $rows): void {
            foreach ($ids as $id) {
                $row = $rows->get($id);
                if (! $row instanceof Message) {
                    continue;
                }

                $this->service->delete($row);
            }
        });

        return back()->with('success', count($ids).' messages deleted successfully.');
    }

    /** GET /messages/trashed - List trashed messages */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Message::class);

        $params = $request->all();
        $params['trashed'] = 'only';
        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }
        $senderFilter = trim((string) $request->query('sender_id', ''));
        if ($senderFilter !== '') {
            $params['filter']['sender_id'] = $senderFilter;
        }
        $receiverFilter = trim((string) $request->query('receiver_id', ''));
        if ($receiverFilter !== '') {
            $params['filter']['receiver_id'] = $receiverFilter;
        }
        $readFilter = trim((string) $request->query('is_read', ''));
        if ($readFilter !== '') {
            $params['filter']['is_read'] = $readFilter;
        }
        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'is_read', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapMessageRows($data);

        return Inertia::render('Messages/Trashed', [
            'messages' => $data,
            'users' => $this->userOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /messages/{id}/restore - Restore message */
    public function restore($id)
    {
        $message = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $message);

        $this->service->restore((int) $id);

        return redirect()->route('messages.trashed')
            ->with('success', 'Message restored successfully.');
    }

    /** POST /messages/batch-restore - Restore multiple messages */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:messages,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = Message::onlyTrashed()
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

        return back()->with('success', count($ids).' messages restored successfully.');
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

    /** POST /messages/batch-force-delete - Permanently delete multiple messages */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:messages,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $rows = Message::onlyTrashed()
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

        return back()->with('success', count($ids).' messages permanently deleted.');
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

    private function mapMessageRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (Message $message) {
                return [
                    'id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender?->name,
                    'receiver_id' => $message->receiver_id,
                    'receiver_name' => $message->receiver?->name,
                    'message_body' => $message->message_body,
                    'is_read' => $message->is_read,
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                    'deleted_at' => $message->deleted_at,
                ];
            })
        );
    }

    private function userOptions(): array
    {
        return User::query()
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
     * @return Collection<int, Message>
     */
    private function resolveBatchRows(array $ids): Collection
    {
        return Message::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Message>  $rows
     */
    private function authorizeBatch(Collection $rows, string $ability): void
    {
        foreach ($rows as $row) {
            $this->authorize($ability, $row);
        }
    }
}
