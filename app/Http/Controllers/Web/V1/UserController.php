<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UserImportRequest;
use App\Http\Requests\User\UserStoreRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private UserService $service) {}

    /** GET /users - List all users */
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $data = $this->service->list($request->all());

        return Inertia::render('Users/Index', [
            'users' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /users/{id} - Show user details */
    public function show(User $user)
    {
        $this->authorize('view', $user);

        $model = $this->service->show($user);

        return Inertia::render('Users/Show', [
            'user' => $model,
        ]);
    }

    /** GET /users/create - Show create form */
    public function create()
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create');
    }

    /** POST /users - Store new user */
    public function store(UserStoreRequest $request)
    {
        $this->authorize('create', User::class);

        $user = $this->service->store($request->validated());

        return redirect()->route('users.show', $user->id)
            ->with('success', 'User created successfully.');
    }

    /** GET /users/{id}/edit - Show edit form */
    public function edit(User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'user' => $user,
        ]);
    }

    /** PUT /users/{id} - Update user */
    public function update(UserUpdateRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $updated = $this->service->update($user, $request->validated());

        return redirect()->route('users.show', $updated->id)
            ->with('success', 'User updated successfully.');
    }

    /** DELETE /users/{id} - Delete user */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        $this->service->delete($user);

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    /** GET /users/trashed - List trashed users */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $data = $this->service->list($params);

        return Inertia::render('Users/Trashed', [
            'users' => $data,
            'query' => $request->all(),
        ]);
    }

    /** GET /users/{id}/restore - Restore user */
    public function restore($id)
    {
        $user = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $user);

        $restored = $this->service->restore((int) $id);

        return redirect()->route('users.show', $restored->id)
            ->with('success', 'User restored successfully.');
    }

    /** DELETE /users/{id}/force - Force delete user */
    public function forceDelete($id)
    {
        $user = $this->service->findTrashed((int) $id);
        $this->authorize('forceDelete', $user);

        $this->service->forceDelete((int) $id);

        return redirect()->route('users.trashed')
            ->with('success', 'User permanently deleted.');
    }
}
