<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\CreateTokenRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
  public function __construct(private AuthService $service)
  {
    // No auth needed for register/login
  }

  /** POST /api/v1/auth/register */
  public function register(RegisterRequest $request)
  {
    $user = $this->service->register($request->validated());
    return ApiResponse::created([
      'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'roles' => $user->getRoleNames(),
      ],
    ]);
  }

  /** POST /api/v1/auth/login-spa (sets cookie) */
  public function loginSpa(LoginRequest $request)
  {
    $user = $this->service->loginSpa($request->validated());
    return ApiResponse::ok(['message' => 'Logged in', 'user' => $user]);
  }

  /** POST /api/v1/auth/login-mobile (returns PAT) */
  public function loginMobile(LoginRequest $request)
  {
    $data = $this->service->loginMobile($request->validated());
    return ApiResponse::ok([
      'token' => $data['token'],
      'user'  => [
        'id' => $data['user']->id,
        'name' => $data['user']->name,
        'roles' => $data['user']->getRoleNames(),
      ],
    ]);
  }

  /** POST /api/v1/auth/tokens (create PAT with custom abilities) */
  public function createToken(CreateTokenRequest $request)
  {
    $token = auth()->user()->createToken($request->name, $request->abilities ?? [])->plainTextToken;
    return ApiResponse::ok(['token' => $token]);
  }

  /** POST /api/v1/auth/logout */
  public function logout(Request $request)
  {
    $this->service->logout();
    return ApiResponse::ok(['message' => 'Logged out']);
  }

  public function logoutAll()
{
    $this->service->logoutAllDevices();
    return ApiResponse::ok(['message' => 'Logged out from all devices']);
}

  /** GET /api/v1/auth/me */
  public function me()
  {
    $u = auth()->user();
    return ApiResponse::ok([
      'id' => $u->id,
      'name' => $u->name,
      'email' => $u->email,
      'roles' => $u->getRoleNames(),
      'permissions' => $u->getAllPermissions()->pluck('name'),
    ]);
  }
}

