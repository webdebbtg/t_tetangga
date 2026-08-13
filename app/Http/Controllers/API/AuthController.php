<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Laravel\Socialite\Facades\Socialite;
use Tymon\JWTAuth\Facades\JWTAuth;
use Exception;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // ─── Google OAuth ──────────────────────────────────────────────────────────

    /**
     * Buat Socialite driver dengan Guzzle yang sudah dikonfigurasi SSL.
     * Di environment lokal (Windows dev), SSL verification dimatikan karena
     * CA bundle PHP sering tidak up-to-date.
     * Di production, SSL verification HARUS aktif.
     */
    private function googleDriver(): \Laravel\Socialite\Two\GoogleProvider
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');

        if (app()->environment('local', 'development')) {
            $driver->setHttpClient(new \GuzzleHttp\Client([
                'verify'  => false,   // Skip SSL di dev — fix cURL error 60
                'timeout' => 30,
            ]));
        }

        return $driver;
    }

    /**
     * Validasi frontend_url dari whitelist — mencegah Open Redirect Attack.
     * Penyerang tidak bisa mengirim token JWT ke domain asing.
     */
    private function sanitizeFrontendUrl(?string $url): string
    {
        $default  = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $allowed  = array_filter(array_map('trim', explode(',',
            env('ALLOWED_FRONTEND_URLS', $default)
        )));

        if ($url) {
            foreach ($allowed as $allowedUrl) {
                if (str_starts_with(rtrim($url, '/'), rtrim($allowedUrl, '/'))) {
                    return rtrim($allowedUrl, '/');
                }
            }
        }

        return rtrim($allowed[array_key_first($allowed)] ?? $default, '/');
    }

    public function googleRedirect(Request $request)
    {
        $frontendUrl = $this->sanitizeFrontendUrl($request->query('frontend_url'));

        $state = base64_encode(json_encode(['frontend_url' => $frontendUrl]));

        $url = $this->googleDriver()
            ->stateless()
            ->with(['state' => $state])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    public function googleCallback(Request $request)
    {
        $frontendUrl = null;
        if ($request->has('state')) {
            try {
                $decoded = json_decode(base64_decode($request->state), true);
                if (isset($decoded['frontend_url'])) {
                    $frontendUrl = $decoded['frontend_url'];
                }
            } catch (Exception $e) {
                // ignore
            }
        }

        // Selalu sanitize URL dari state — cegah manipulasi state parameter
        $frontendUrl = $this->sanitizeFrontendUrl($frontendUrl);

        try {
            $googleUser = $this->googleDriver()->stateless()->user();

            // Cek apakah user sudah ada berdasarkan email (bisa jadi punya akun email sebelumnya)
            $existingByEmail = User::where('email', $googleUser->getEmail())
                ->whereNull('google_id')
                ->first();

            if ($existingByEmail) {
                // Hubungkan akun Google ke akun email yang sudah ada
                // forceFill dipakai karena google_id dan email_verified_at di-guarded
                $existingByEmail->forceFill([
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar() ?? $existingByEmail->avatar,
                    'email_verified_at' => $existingByEmail->email_verified_at ?? now(),
                ])->save();
                $user = $existingByEmail->fresh();
            } else {
                // Cek apakah user Google sudah pernah ada
                $existingGoogle = User::where('google_id', $googleUser->getId())->first();

                if ($existingGoogle) {
                    // User sudah ada — hanya update data profil Google (nama, avatar).
                    // JANGAN reset status_kelayakan atau profil_lengkap!
                    $existingGoogle->forceFill([
                        'name'              => $googleUser->getName(),
                        'email'             => $googleUser->getEmail(),
                        'avatar'            => $googleUser->getAvatar(),
                        'email_verified_at' => $existingGoogle->email_verified_at ?? now(),
                    ])->save();
                    $user = $existingGoogle->fresh();
                } else {
                    // User baru — forceFill untuk bypass guarded pada field sistem (role, status, dll)
                    $user = (new User())->forceFill([
                        'google_id'          => $googleUser->getId(),
                        'name'               => $googleUser->getName(),
                        'email'              => $googleUser->getEmail(),
                        'avatar'             => $googleUser->getAvatar(),
                        'email_verified_at'  => now(),
                        'password'           => null,
                        'role'               => 'masyarakat',
                        'status_kelayakan'   => 'BELUM',
                        'profil_lengkap'     => false,
                    ]);
                    $user->save();
                }
            }

            $token = JWTAuth::fromUser($user);

            return redirect("{$frontendUrl}/auth/callback?token={$token}&new_user=" . ($user->wasRecentlyCreated ? '1' : '0'));
        } catch (Exception $e) {
            // Log error detail agar mudah di-debug
            Log::error('[Google OAuth] Callback gagal', [
                'message'   => $e->getMessage(),
                'class'     => get_class($e),
                'file'      => $e->getFile() . ':' . $e->getLine(),
                'query'     => $request->query->all(),
            ]);

            // Jangan ekspos detail error teknis ke URL (information disclosure)
            return redirect("{$frontendUrl}/login?error=google_failed");
        }
    }

    // ─── Email / Password Login ────────────────────────────────────────────────

    public function login(Request $request)
    {
        $request->validate([
            'email'                  => 'required|email',
            'password'               => 'required|string',
            'cf_turnstile_response'  => 'required|string',
        ]);

        // ── Verifikasi Cloudflare Turnstile (skip di env local/testing) ──
        $turnstileSecret = env('TURNSTILE_SECRET_KEY');
        if ($turnstileSecret && !app()->environment('local', 'testing')) {
            try {
                $cfResponse = Http::timeout(10)
                    ->asForm()
                    ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                        'secret'   => $turnstileSecret,
                        'response' => $request->cf_turnstile_response,
                        'remoteip' => $request->ip(),
                    ]);

                $cfData = $cfResponse->json();
                if (!($cfData['success'] ?? false)) {
                    Log::warning('[Turnstile] Verifikasi gagal', [
                        'ip'          => $request->ip(),
                        'error-codes' => $cfData['error-codes'] ?? [],
                    ]);
                    return response()->json([
                        'error' => 'Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.',
                    ], 422);
                }
            } catch (\Exception $e) {
                // Jika Cloudflare tidak dapat dijangkau (mis. offline dev), log saja, jangan blokir
                Log::warning('[Turnstile] Tidak dapat menghubungi Cloudflare: ' . $e->getMessage());
            }
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !$user->password || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Email atau password tidak valid.',
            ], 401);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user'       => $user->load('sekolah', 'opd'),
        ]);
    }

    // ─── Register ─────────────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'telepon'  => 'required|string|max:15|unique:users,telepon',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        // forceFill untuk field guarded (role, profil_lengkap, status_kelayakan, email_verified_at)
        $user = (new User())->forceFill([
            'name'               => $request->name,
            'email'              => $request->email,
            'telepon'            => $request->telepon,
            'password'           => Hash::make($request->password),
            'role'               => 'masyarakat',   // default; diubah di /profil/lengkapi
            'profil_lengkap'     => false,
            'status_kelayakan'   => 'BELUM',
            'email_verified_at'  => now(),
        ]);
        $user->save();

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user'       => $user->load('sekolah', 'opd'),
        ], 201);
    }

    // ─── Forgot Password ──────────────────────────────────────────────────────

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Link reset password telah dikirim ke email Anda.']);
        }

        return response()->json(['error' => 'Gagal mengirim email reset. Coba lagi dalam beberapa saat.'], 429);
    }

    // ─── Reset Password ───────────────────────────────────────────────────────

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password berhasil direset. Silakan login.']);
        }

        return response()->json(['error' => 'Token tidak valid atau kadaluarsa.'], 422);
    }

    // ─── Authenticated endpoints ───────────────────────────────────────────────

    public function me(Request $request)
    {
        $user = Auth::user()->load('sekolah', 'opd');
        return response()->json([
            'user'          => $user,
            'sudah_lulus'   => $user->sudahLulus(),
            'profil_lengkap'=> $user->profil_lengkap,
        ]);
    }

    public function updateProfil(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Hanya user yang belum lengkap profilnya yang boleh ubah role
        $allowRoleChange = !$user->profil_lengkap;

        $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email,' . $user->id,
            'nis'        => 'nullable|string|max:20|required_if:role,siswa|unique:users,nis,' . $user->id,
            'telepon'    => 'required|string|max:15|unique:users,telepon,' . $user->id,
            'alamat'     => 'required|string',
            'latitude'   => 'required|numeric',
            'longitude'  => 'required|numeric',
            'role'       => $allowRoleChange ? 'required|in:siswa,masyarakat' : 'sometimes|in:siswa,masyarakat',
            'sekolah_id' => 'nullable|exists:sekolah,id|required_if:role,siswa',
            'kelas'      => 'nullable|string|max:10|required_if:role,siswa',
            'password'   => 'nullable|string|min:8|confirmed',
        ], [
            // Required
            'name.required'       => 'Nama lengkap tidak boleh kosong.',
            'email.required'      => 'Alamat email tidak boleh kosong.',
            'telepon.required'    => 'Nomor handphone tidak boleh kosong.',
            'alamat.required'     => 'Alamat tempat tinggal tidak boleh kosong.',
            'latitude.required'   => 'Titik lokasi belum dipilih, gunakan GPS atau klik pada peta.',
            'longitude.required'  => 'Titik lokasi belum dipilih, gunakan GPS atau klik pada peta.',
            'role.required'       => 'Peran pengguna harus dipilih.',
            'nis.required_if'     => 'NIS (Nomor Induk Siswa) wajib diisi untuk akun siswa.',
            'sekolah_id.required_if' => 'Sekolah wajib dipilih untuk akun siswa.',
            'kelas.required_if'   => 'Kelas wajib diisi untuk akun siswa.',
            // Unique
            'telepon.unique'      => 'Nomor handphone yang Anda daftarkan sudah digunakan oleh pengguna lain, silakan gunakan nomor handphone lainnya.',
            'nis.unique'          => 'NIS tersebut sudah terdaftar, silakan periksa kembali nomor induk siswa Anda.',
            'email.unique'        => 'Alamat email tersebut sudah digunakan oleh akun lain.',
            // Format
            'email.email'         => 'Format alamat email tidak valid.',
            'telepon.max'         => 'Nomor handphone maksimal 15 karakter.',
            'name.max'            => 'Nama lengkap maksimal 100 karakter.',
            'latitude.numeric'    => 'Koordinat latitude tidak valid.',
            'longitude.numeric'   => 'Koordinat longitude tidak valid.',
            'sekolah_id.exists'   => 'Sekolah yang dipilih tidak ditemukan.',
        ]);

        // Whitelist field yang boleh diubah — tidak ada status_kelayakan / role admin / dsb
        $updateData = $request->only(['name', 'email', 'nis', 'telepon', 'alamat', 'latitude', 'longitude', 'sekolah_id', 'kelas']);

        if ($allowRoleChange && $request->filled('role')) {
            $updateData['role'] = $request->role;
        }

        // Ganti password jika diisi
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        // Profil dianggap lengkap jika data inti sudah terisi
        $isLengkap = !empty($request->email) && !empty($request->telepon) && !empty($request->alamat) && !empty($request->latitude) && !empty($request->longitude);
        if (($updateData['role'] ?? $user->role) === 'siswa') {
            $isLengkap = $isLengkap && !empty($request->nis) && !empty($request->sekolah_id) && !empty($request->kelas);
        }
        // profil_lengkap dan role adalah guarded field — pakai forceFill
        $guardedData = ['profil_lengkap' => $isLengkap];
        if ($allowRoleChange && isset($updateData['role'])) {
            $guardedData['role'] = $updateData['role'];
            unset($updateData['role']);
        }

        $user->fill($updateData)->forceFill($guardedData)->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user'    => $user->fresh()->load('sekolah', 'opd'),
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Berhasil logout']);
    }

    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());
        return response()->json(['token' => $token]);
    }
}
