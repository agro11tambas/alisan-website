# Link Login Customer (magic link)

Sisi website sudah jadi: halaman `/m/<kode>` di `src/app/m/[code]/` menebus kode,
menyimpan sesi, lalu melempar pengunjung ke tujuannya. Yang belum ada adalah dua
endpoint di ERP — generate, tebus, cabut. Dokumen ini kontraknya.

Alur yang dituju: admin/sales menekan tombol di ERP → dapat URL siap-kirim →
dikirim ke customer via WhatsApp → customer menekan link → langsung masuk tanpa
mengetik password.

Fitur serupa sudah berjalan di ERP untuk reset password, dan sebaiknya dicontoh
sedekat mungkin daripada dirancang ulang:

| Acuan yang sudah ada | Padanannya |
| --- | --- |
| `app/Models/CustomerPasswordResetToken.php` | `CustomerLoginLink` |
| tabel `customer_password_reset_tokens` | `customer_login_links` |
| `CustomerAccountController::generatePasswordResetLink()` | `generateLoginLink()` |
| `routes/web.php` → `/erp/customer-accounts/{id}/password-reset-link` | `.../login-link` |
| `erp.pages.customer-accounts.partials.action-button` | tombol "Buat Link Login" |
| `CustomerAuthController::login()` | penerbitan token di `redeemLoginLink()` |

Satu hal yang memang beda: token reset panjangnya 64 karakter, sedangkan kode
login dipatok 8 supaya link-nya pendek untuk WhatsApp. Lihat bagian 7.

## 1. Kontrak endpoint penebusan (wajib)

Ini satu-satunya endpoint yang dipanggil website.

```
POST /api/v1/ecommerce/auth/login-link/redeem
Content-Type: application/json

{ "code": "aBcDe1Fg" }
```

Respons sukses harus **bentuknya sama persis** dengan `POST /ecommerce/auth/login`,
karena website memakai tipe dan jalur penyimpanan sesi yang sama:

```json
{
  "success": true,
  "message": "Berhasil masuk",
  "data": {
    "token": "<bearer token>",
    "token_type": "Bearer",
    "customer": { "id": "...", "full_name": "...", "email": "...", "whatsapp_number": "..." }
  }
}
```

Respons gagal harus **422** dengan `{ "message": "..." }`. Website menampilkan isi
`message` apa adanya, jadi tulis dalam bahasa Indonesia dan tanpa detail teknis —
misalnya "Link login sudah pernah dipakai." atau "Link login sudah kedaluwarsa.".

Status 422 itu bukan pilihan bebas: hanya status inilah yang dipercaya website
sebagai penolakan yang disengaja. Status lain (404 route salah, 500, 429) dianggap
gangguan teknis dan customer melihat pesan umum, supaya pesan framework berbahasa
Inggris tidak pernah tampil di halaman.

Dua hal yang gampang terlewat:

- **Endpoint ini publik.** Jangan ditaruh di belakang middleware `auth`. Website
  sengaja mengirimnya tanpa header `Authorization`, tapi kalau middleware auth
  ikut jalan dan menolak lebih dulu, link tidak akan pernah berfungsi.
- **Kode adalah kredensial.** Jangan mengembalikan token kalau kode kedaluwarsa,
  sudah dipakai (saat `single_use`), atau customernya sudah dinonaktifkan.

## 2. Endpoint/tombol pembuat link

Dipakai dari sisi admin, bukan dari website:

Ikuti pola tombol reset password yang sudah ada, yaitu route admin di
`routes/web.php`, bukan API publik:

```
POST /erp/customer-accounts/{id}/login-link
{ "expires_in_hours": null, "single_use": false }

→ { "success": true, "data": { "login_url": "...", "expires_at": null } }

POST /erp/customer-accounts/{id}/login-link/revoke
→ { "success": true, "message": "Link login sudah dicabut." }
```

URL-nya dirakit dari config yang sudah dipakai `generatePasswordResetLink()`:

```php
$websiteUrl = rtrim(config('app.frontend_website_url'), '/');
$loginUrl = $websiteUrl.'/m/'.$code;
```

Tombolnya menyusul ke
`resources/views/erp/pages/customer-accounts/partials/action-button.blade.php`,
di samping tombol reset password, dan menampilkan URL beserta tombol copy.

Akses route ini harus dibatasi ke user ERP yang memang berhak — siapa pun yang
bisa memanggilnya bisa masuk sebagai customer mana pun.

## 3. Tabel

```php
Schema::create('customer_login_links', function (Blueprint $table) {
    $table->id();
    // Mengacu ke customer_accounts, sama seperti customer_password_reset_tokens:
    // yang login adalah akunnya, bukan baris customer.
    $table->foreignId('customer_account_id')->constrained()->cascadeOnDelete();
    $table->string('code_hash', 64)->unique();   // sha256 dari kode, bukan kodenya
    $table->boolean('single_use')->default(false);
    // null = tidak pernah kedaluwarsa. Lihat bagian 7: yang mematikan link
    // bukan waktu, tapi tombol cabut.
    $table->timestamp('expires_at')->nullable();
    // Pemakaian terakhir, bukan pemakaian satu-satunya: link boleh dipakai
    // berkali-kali, dan use_count yang melonjak itu tanda link tersebar.
    $table->timestamp('used_at')->nullable();
    $table->string('used_ip', 45)->nullable();
    $table->unsignedInteger('use_count')->default(0);
    $table->timestamp('revoked_at')->nullable();
    $table->foreignId('revoked_by')->nullable()->constrained('users');
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
});
```

Kode mentahnya hanya ada dua kali: di respons pembuatan link dan di URL yang
dipegang customer. Database cukup menyimpan hash-nya — kalau tabel ini bocor,
tidak ada link yang bisa langsung dipakai.

Pakai `sha256` biasa, bukan bcrypt: kodenya acak 48+ bit sehingga tidak perlu
tahan brute-force seperti password, dan hash cepat bisa dicari lewat index unik
tanpa memindai seluruh tabel.

## 4. Pembuatan kode

```php
// 16 karakter base62 ≈ 95 bit. Panjang ini dipilih karena link-nya permanen;
// lihat catatan di bawah sebelum memendekkannya.
$alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
$code = '';
for ($i = 0; $i < 16; $i++) {
    $code .= $alphabet[random_int(0, 61)];
}
```

Rancangan awal memakai 8 karakter, dan itu masuk akal selama link hanya hidup 24
jam. Begitu link jadi permanen, jendela serangannya hilang: penebak punya waktu
tak terbatas, jumlah kode yang sah bertambah seiring jumlah customer, dan tidak
ada satu pun kode yang pernah gugur sendiri. 62^8 ≈ 2,2 × 10^14 terdengar besar,
tapi yang dicari penyerang bukan satu kode tertentu — cukup kode siapa saja, jadi
peluangnya dikali jumlah link aktif dan dikumpulkan selamanya. 62^16 ≈ 4,8 × 10^28
menutup perhitungan itu, dan URL-nya masih cukup pendek untuk WhatsApp.

`random_int`, bukan `rand`/`mt_rand`/`uniqid` — yang terakhir dapat diprediksi
dan di sini itu berarti tamu bisa menebak link login orang lain.

## 5. Penebusan

```php
public function redeem(Request $request)
{
    $data = $request->validate(['code' => ['required', 'string', 'max:64']]);

    // Kunci barisnya di dalam transaksi: dua klik hampir bersamaan (preview
    // WhatsApp lalu customer menekan link) tidak boleh dua-duanya dapat token.
    $result = DB::transaction(function () use ($data, $request) {
        $link = CustomerLoginLink::where('code_hash', hash('sha256', $data['code']))
            ->lockForUpdate()
            ->first();

        if (! $link) {
            return ['error' => 'Link login tidak dikenal.'];
        }
        // expires_at null berarti tidak pernah kedaluwarsa.
        if ($link->expires_at && $link->expires_at->isPast()) {
            return ['error' => 'Link login sudah kedaluwarsa.'];
        }
        if ($link->revoked_at) {
            return ['error' => 'Link login sudah dicabut.'];
        }
        if ($link->single_use && $link->used_at) {
            return ['error' => 'Link login sudah pernah dipakai.'];
        }

        $link->forceFill([
            'used_at' => now(),
            'used_ip' => $request->ip(),
        ])->save();

        return ['account' => $link->customerAccount];
    });

    if (isset($result['error'])) {
        return response()->json(['message' => $result['error']], 422);
    }

    // Terbitkan token persis seperti login biasa — createToken('customer-token')
    // di CustomerAuthController::login() — supaya /auth/me, /auth/logout dan
    // sinkronisasi cart tidak perlu tahu bedanya. Akun dengan is_active = false
    // tetap harus ditolak, dan last_login_at ikut diisi seperti di login().
    return $this->issueCustomerSession($result['account']);
}
```

Catat juga `used_at`/`used_ip`: kalau nanti ada sengketa order, itu satu-satunya
jejak bahwa yang masuk memang orang yang dikirimi link.

## 6. Kenapa `/m/<kode>`, bukan `/<kode>`

Route `/<kode>` di root akan menangkap **semua** path yang tidak dikenal, jadi
halaman 404 website mati dan setiap route baru nanti berisiko tertelan. `/m/`
hanya menambah dua karakter. Kalau suatu saat tetap mau bentuk root, batasi di
`src/proxy.ts` dengan pola ketat (`^/[A-Za-z0-9]{8}$`) dan rewrite ke `/m/<kode>`.

## 7. Batas keamanan yang perlu diterima

**Throttle tetap wajib.** Endpoint penebusan terbuka untuk siapa saja, jadi
route-nya dibatasi laju seperti `/login` yang sudah pakai `throttle:5,1`. Panjang
kode 16 karakter membuat penebakan tidak masuk akal secara matematis, tapi
throttle-lah yang membuat percobaan massal terlihat di log dan tidak menghabiskan
worker PHP yang sama dengan ERP.

**Link ini memang permanen, dan itu keputusan sadar.** Customer menyimpan pesan
WhatsApp lama dan membukanya berbulan-bulan kemudian; link yang mati dalam 24 jam
membuat fitur ini tidak berguna untuk cara itu dipakai. Jadi default-nya tanpa
kedaluwarsa dan boleh dipakai berkali-kali.

Konsekuensinya harus diterima apa adanya: link itu password permanen yang
berbentuk URL, tersimpan di chat yang bisa di-forward, di-screenshot, atau dibuka
di HP yang dipinjam — dan tidak ada yang akan tahu kalau bocor.

Karena itu dua hal menggantikan peran kedaluwarsa, dan keduanya bukan opsional:

- **Tombol cabut di ERP.** Tanpa kedaluwarsa, satu-satunya cara mematikan link
  yang bocor kalau tombol ini tidak ada adalah menonaktifkan seluruh akun.
- **Satu link aktif per customer.** Membuat link baru mencabut yang lama, jadi
  jumlah kredensial yang beredar tidak pernah menumpuk tanpa diketahui.

Database hanya menyimpan hash-nya, jadi URL yang sudah ditutup tidak bisa
ditampilkan ulang. Modal generate wajib menyatakan itu: kode hanya terlihat
sekali, dan generate ulang mematikan link yang mungkin sudah dikirim ke customer.

Satu batas yang tetap berlaku: jangan pakai link ini untuk akun yang boleh
mengubah data sensitif tanpa konfirmasi ulang.
