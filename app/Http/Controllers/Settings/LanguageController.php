<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\LanguageUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    /**
     * Show the user's language settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/language', [
            'selectedLocale' => $request->user()?->locale ?? app()->getLocale(),
        ]);
    }

    /**
     * Update the user's language preference.
     */
    public function update(LanguageUpdateRequest $request): RedirectResponse
    {
        $locale = $request->validated('locale');
        $user = $request->user();

        if ($user !== null) {
            $user->forceFill(['locale' => $locale])->save();
        }

        $request->session()->put('locale', $locale);
        app()->setLocale($locale);

        return to_route('language.edit')->with('success', __('Language preference updated.'));
    }
}
