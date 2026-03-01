<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UserImportRequest;
use App\Http\Requests\User\UserStoreRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Models\Classroom;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private UserService $service) {}

    /** GET /users - List all users */
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $params = $request->all();

        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }

        $classFilter = trim((string) $request->query('class_id', ''));
        if ($classFilter !== '') {
            $params['filter']['class_id'] = $classFilter;
        }

        $parentFilter = trim((string) $request->query('parent_id', ''));
        if ($parentFilter !== '') {
            $params['filter']['parent_id'] = $parentFilter;
        }

        $roleFilter = trim((string) $request->query('role', ''));
        if ($roleFilter !== '') {
            $params['filter']['role'] = $roleFilter;
        }

        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'name', 'email', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapUserRows($data);

        return Inertia::render('Users/Index', [
            'users' => $data,
            'classes' => $this->classOptions(),
            'parents' => $this->parentOptions(),
            'roles' => $this->roleOptions(),
            'query' => $request->all(),
        ]);
    }

    /** GET /users/{id} - Show user details */
    public function show(User $user)
    {
        $this->authorize('view', $user);

        $model = $this->service->show($user->load(['class:id,name', 'parent:id,name', 'roles:id,name']));

        return Inertia::render('Users/Show', [
            'user' => $model,
        ]);
    }

    /** GET /users/create - Show create form */
    public function create()
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create', [
            'classes' => $this->classOptions(),
            'parents' => $this->parentOptions(),
            'roles' => $this->roleOptions(),
        ]);
    }

    /** POST /users - Store new user */
    public function store(UserStoreRequest $request)
    {
        $this->authorize('create', User::class);

        $this->service->store($request->validated());

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    /** POST /users/batch-store - Create multiple users */
    public function batchStore(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.email' => ['required', 'email:rfc,dns', 'max:255', 'distinct', 'unique:users,email'],
            'items.*.password' => ['required', 'string', 'min:8', 'max:64'],
            'items.*.password_confirmation' => ['required', 'string', 'min:8', 'max:64'],
            'items.*.phone' => ['nullable', 'string', 'max:32', 'regex:/^[0-9+\-() .]+$/'],
            'items.*.gender' => ['nullable', 'in:male,female'],
            'items.*.class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'items.*.parent_id' => ['nullable', 'integer', 'exists:users,id'],
            'items.*.role' => ['nullable', 'string', 'exists:roles,name'],
        ]);

        foreach ($validated['items'] as $index => $item) {
            $password = (string) ($item['password'] ?? '');
            $passwordConfirmation = (string) ($item['password_confirmation'] ?? '');
            if ($password !== $passwordConfirmation) {
                throw ValidationException::withMessages([
                    "items.{$index}.password_confirmation" => 'The password confirmation does not match.',
                ]);
            }
        }

        DB::transaction(function () use ($validated): void {
            foreach ($validated['items'] as $item) {
                $this->service->store([
                    'name' => trim((string) $item['name']),
                    'email' => strtolower(trim((string) $item['email'])),
                    'password' => (string) $item['password'],
                    'phone' => isset($item['phone']) ? trim((string) $item['phone']) : null,
                    'gender' => isset($item['gender']) ? strtolower(trim((string) $item['gender'])) : null,
                    'class_id' => $item['class_id'] ?? null,
                    'parent_id' => $item['parent_id'] ?? null,
                    'role' => isset($item['role']) ? trim((string) $item['role']) : null,
                ]);
            }
        });

        return back()->with('success', count($validated['items']).' users created successfully.');
    }

    /** GET /users/{id}/edit - Show edit form */
    public function edit(User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'user' => $user->load(['class:id,name', 'parent:id,name', 'roles:id,name']),
            'classes' => $this->classOptions(),
            'parents' => $this->parentOptions(),
            'roles' => $this->roleOptions(),
        ]);
    }

    /** PUT /users/{id} - Update user */
    public function update(UserUpdateRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $this->service->update($user, $request->validated());

        return redirect()->route('users.index')
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

    /** POST /users/batch-assign-class - Assign class for multiple users */
    public function batchAssignClass(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:users,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $users = $this->resolveBatchUsers($ids);
        $this->authorizeBatch($users, 'update');

        $classId = $validated['class_id'] ?? null;

        DB::transaction(function () use ($ids, $users, $classId): void {
            foreach ($ids as $id) {
                $model = $users->get($id);
                if (! $model instanceof User) {
                    continue;
                }

                $this->service->update($model, [
                    'class_id' => $classId,
                ]);
            }
        });

        return back()->with('success', count($ids).' users updated successfully.');
    }

    /** POST /users/batch-delete - Delete multiple users */
    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $users = $this->resolveBatchUsers($ids);
        $this->authorizeBatch($users, 'delete');

        DB::transaction(function () use ($ids, $users): void {
            foreach ($ids as $id) {
                $model = $users->get($id);
                if (! $model instanceof User) {
                    continue;
                }

                $this->service->delete($model);
            }
        });

        return back()->with('success', count($ids).' users deleted successfully.');
    }

    /** GET /users/trashed - List trashed users */
    public function trashed(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $params = $request->all();
        $params['trashed'] = 'only';

        $searchQuery = trim((string) $request->query('q', ''));
        if ($searchQuery !== '') {
            $params['filter']['q'] = $searchQuery;
        }

        $classFilter = trim((string) $request->query('class_id', ''));
        if ($classFilter !== '') {
            $params['filter']['class_id'] = $classFilter;
        }

        $parentFilter = trim((string) $request->query('parent_id', ''));
        if ($parentFilter !== '') {
            $params['filter']['parent_id'] = $parentFilter;
        }

        $roleFilter = trim((string) $request->query('role', ''));
        if ($roleFilter !== '') {
            $params['filter']['role'] = $roleFilter;
        }

        $sortBy = (string) $request->query('sort_by', '');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc'));
        if ($sortBy !== '' && in_array($sortBy, ['id', 'name', 'email', 'created_at'], true)) {
            $params['sort'] = $sortDir === 'desc' ? '-'.$sortBy : $sortBy;
        }

        $data = $this->service->list($params);
        $data->appends($request->query());
        $this->mapUserRows($data);

        return Inertia::render('Users/Trashed', [
            'users' => $data,
            'classes' => $this->classOptions(),
            'parents' => $this->parentOptions(),
            'roles' => $this->roleOptions(),
            'query' => $request->all(),
        ]);
    }

    /** POST /users/{id}/restore - Restore user */
    public function restore($id)
    {
        $user = $this->service->findTrashed((int) $id);
        $this->authorize('restore', $user);

        $this->service->restore((int) $id);

        return redirect()->route('users.index')
            ->with('success', 'User restored successfully.');
    }

    /** POST /users/batch-restore - Restore multiple users */
    public function batchRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $trashedUsers = User::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($trashedUsers as $user) {
            $this->authorize('restore', $user);
        }

        DB::transaction(function () use ($ids, $trashedUsers): void {
            foreach ($ids as $id) {
                if (! $trashedUsers->has($id)) {
                    continue;
                }

                $this->service->restore((int) $id);
            }
        });

        return back()->with('success', count($ids).' users restored successfully.');
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

    /** POST /users/batch-force-delete - Permanently delete multiple users */
    public function batchForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $ids = $this->sanitizeBatchIds($validated['ids']);
        $trashedUsers = User::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($trashedUsers as $user) {
            $this->authorize('forceDelete', $user);
        }

        DB::transaction(function () use ($ids, $trashedUsers): void {
            foreach ($ids as $id) {
                if (! $trashedUsers->has($id)) {
                    continue;
                }

                $this->service->forceDelete((int) $id);
            }
        });

        return back()->with('success', count($ids).' users permanently deleted.');
    }

    /** POST /users/import - Import users from file */
    public function import(UserImportRequest $request)
    {
        $this->authorize('import', User::class);

        $file = $request->file('file');
        $this->service->import($file);

        return redirect()->route('users.index')
            ->with('success', 'Import queued. You will be notified when complete.');
    }

    /** GET /users/export/csv - Export users to CSV */
    public function exportCsv()
    {
        $this->authorize('export', User::class);

        return $this->service->exportCsv();
    }

    /** GET /users/suggestions - Live search suggestions */
    public function suggestions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            return response()->json(['data' => []]);
        }

        $rows = User::query()
            ->select(['id', 'name', 'email'])
            ->where(function (Builder $builder) use ($query): void {
                $this->applyCaseInsensitiveContains($builder, 'name', $query);
                $builder->orWhere(function (Builder $emailQuery) use ($query): void {
                    $this->applyCaseInsensitiveContains($emailQuery, 'email', $query);
                });
            })
            ->orderBy('name')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => $rows->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])->values(),
        ]);
    }

    private function mapUserRows(LengthAwarePaginator $paginator): void
    {
        $paginator->setCollection(
            $paginator->getCollection()->map(function (User $user) {
                $roleNames = $user->roles->pluck('name')->values()->all();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'telegram_chat_id' => $user->telegram_chat_id,
                    'avatar' => $user->avatar,
                    'phone' => $user->phone,
                    'gender' => $user->gender,
                    'dob' => $user->dob?->toDateString(),
                    'position' => $user->position,
                    'address' => $user->address,
                    'class_id' => $user->class_id,
                    'class_name' => $user->class?->name,
                    'parent_id' => $user->parent_id,
                    'parent_name' => $user->parent?->name,
                    'role_name' => $roleNames[0] ?? null,
                    'role_names' => $roleNames,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'deleted_at' => $user->deleted_at,
                ];
            })
        );
    }

    private function classOptions(): array
    {
        return Classroom::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (Classroom $classroom) => [
                'id' => $classroom->id,
                'name' => $classroom->name,
            ])
            ->values()
            ->all();
    }

    private function parentOptions(): array
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

    private function roleOptions(): array
    {
        return Role::query()
            ->select(['name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'name' => $role->name,
            ])
            ->values()
            ->all();
    }

    private function applyCaseInsensitiveContains(Builder $query, string $column, string $term): void
    {
        $wrappedColumn = $query->getQuery()->getGrammar()->wrap($column);

        $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.mb_strtolower($term).'%']);
    }

    private function sanitizeBatchIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    /**
     * @param  int[]  $ids
     * @return Collection<int, User>
     */
    private function resolveBatchUsers(array $ids): Collection
    {
        return User::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, User>  $users
     */
    private function authorizeBatch(Collection $users, string $ability): void
    {
        foreach ($users as $user) {
            $this->authorize($ability, $user);
        }
    }
}
