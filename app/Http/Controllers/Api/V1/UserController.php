<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\UserImportRequest;
use App\Http\Requests\User\UserStoreRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Http\Resources\User\UserCollection;
use App\Http\Resources\User\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private UserService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $data = $this->service->list($request->all());

        // keep query params in pagination links
        $data->appends($request->query());

        return ApiResponse::paginated(new UserCollection($data));
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);

        $model = $this->service->show($user);

        return ApiResponse::ok(new UserResource($model));
    }

    public function store(UserStoreRequest $request)
    {
        $this->authorize('create', User::class);

        $user = $this->service->store($request->validated());

        return ApiResponse::created(new UserResource($user));
    }

    public function update(UserUpdateRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $updated = $this->service->update($user, $request->validated());

        return ApiResponse::ok(new UserResource($updated));
    }

    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        $this->service->delete($user);

        return ApiResponse::deleted();
    }

    public function trashed(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        $data->appends($request->query());

        return ApiResponse::paginated(new UserCollection($data));
    }

    public function findTrashed($id)
    {
        $user = $this->service->findTrashed((int) $id);
        $this->authorize('view', $user);

        return ApiResponse::ok(new UserResource($user));
    }

    public function restore($id)
    {
        $user = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $user);

        $restored = $this->service->restore((int) $id);

        return ApiResponse::ok(new UserResource($restored));
    }

    public function forceDelete($id)
    {
        $user = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $user);

        $this->service->forceDelete((int) $id);

        return ApiResponse::deleted();
    }

    public function import(UserImportRequest $request)
    {
        $this->authorize('import', User::class);

        $file = $request->file('file');

        $this->service->import($file);

        return ApiResponse::ok(['message' => 'Import queued']);
    }

    public function exportCsv()
    {
        $this->authorize('export', User::class);

        return $this->service->exportCsv();
    }
}
