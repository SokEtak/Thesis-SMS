<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Message;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use App\Services\MessageService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Requests\Message\UpdateMessageRequest;
use App\Http\Requests\Message\MessageImportRequest;
use App\Http\Resources\Message\MessageCollection;
use App\Http\Resources\Message\MessageResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class MessageController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private MessageService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Message::class);

        $data = $this->service->list($request->all());

        $data->appends($request->query());

        return ApiResponse::paginated(new MessageCollection($data));
    }

    public function show(Message $message)
    {
        $this->authorize('view', $message);

        $model = $this->service->show($message);

        return ApiResponse::ok(new MessageResource($model));
    }

    public function store(StoreMessageRequest $request)
    {
        $this->authorize('create', Message::class);

        $item = $this->service->store($request->validated());

        return ApiResponse::created(new MessageResource($item));
    }

    public function update(UpdateMessageRequest $request, Message $message)
    {
        $this->authorize('update', $message);

        $updated = $this->service->update($message, $request->validated());

        return ApiResponse::ok(new MessageResource($updated));
    }

    public function destroy(Message $message)
    {
        $this->authorize('delete', $message);

        $this->service->delete($message);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', Message::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new MessageCollection($data));
    }

    public function findTrashed($id)
    {
        $message = $this->service->findTrashed((int) $id);
        $this->authorize('view', $message);

        return ApiResponse::ok(new MessageResource($message));
    }

    public function restore($id)
    {
        $message = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $message);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new MessageResource($restored));
    }

    public function forceDelete($id)
    {
        $message = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $message);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(MessageImportRequest $request)
    {
        $this->authorize('import', Message::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', Message::class);

        return $this->service->exportCsv();
    }
}
