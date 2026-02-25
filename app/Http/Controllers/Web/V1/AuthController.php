<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function __construct(private AuthService $service)
    {
        // No auth needed for register/login
    }

    /** GET /auth/register - Show register form */
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    /** POST /auth/register - Handle registration */
    public function register(RegisterRequest $request)
    {
        $user = $this->service->register($request->validated());

        return redirect()->route('auth.showLogin')
            ->with('success', 'Registration successful. Please login.');
    }

    /** GET /auth/login - Show login form */
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    /** POST /auth/login - Handle login */
    public function login(LoginRequest $request)
    {
        $user = $this->service->loginSpa($request->validated());

        return redirect()->intended('/')
            ->with('success', 'Logged in successfully.');
    }

    /** POST /auth/logout */
    public function logout(Request $request)
    {
        $this->service->logout();

        return redirect()->route('auth.showLogin')
            ->with('success', 'Logged out successfully.');
    }

    /** POST /auth/logout-all */
    public function logoutAll()
    {
        $this->service->logoutAllDevices();

        return redirect()->route('auth.showLogin')
            ->with('success', 'Logged out from all devices.');
    }
}
