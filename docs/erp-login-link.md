# Link Login Customer (magic link)

Sisi website sudah jadi: halaman `/m/<kode>` di `src/app/m/[code]/` menebus kode,
menyimpan sesi, lalu melempar pengunjung ke tujuannya. Yang belum ada adalah dua
endpoint di ERP. Dokumen ini kontraknya.

Alur yang dituju: admin/sales menekan tombol di ERP → dapat URL siap-kirim →
dikirim ke customer via WhatsApp → customer menekan link → langsung masuk tanpa
mengetik password.

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

```
POST /api/v1/ecommerce/admin/customers/{customer}/login-link
{ "expires_in_hours": 24, "single_use": true }

→ { "data": { "url": "https://alisanprinting.com/m/aBcDe1Fg", "expires_at": "..." } }
```

Taruh tombol "Buat Link Login" di halaman detail Customer yang memanggil ini,
menampilkan URL-nya, dan menyediakan tombol copy. Host-nya ambil dari config
(`APP_WEBSITE_URL`) supaya staging tidak mengirim link produksi.

Akses endpoint ini harus dibatasi ke user ERP yang memang berhak — siapa pun yang
bisa memanggilnya bisa masuk sebagai customer mana pun.

## 3. Tabel

```php
Schema::create('customer_login_links', function (Blueprint $table) {
    $table->id();
    $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
    $table->string('code_hash', 64)->unique();   // sha256 dari kode, bukan kodenya
    $table->boolean('single_use')->default(true);
    $table->timestamp('expires_at');
    $table->timestamp('used_at')->nullable();
    $table->string('used_ip', 45)->nullable();
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
// 8 karakter base62 ≈ 47 bit. Cukup acak untuk tidak bisa ditebak, dan masih
// pendek untuk dikirim lewat WhatsApp.
$alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
$code = '';
for ($i = 0; $i < 8; $i++) {
    $code .= $alphabet[random_int(0, 61)];
}
```

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
        if ($link->expires_at->isPast()) {
            return ['error' => 'Link login sudah kedaluwarsa.'];
        }
        if ($link->single_use && $link->used_at) {
            return ['error' => 'Link login sudah pernah dipakai.'];
        }

        $link->forceFill([
            'used_at' => now(),
            'used_ip' => $request->ip(),
        ])->save();

        return ['customer' => $link->customer];
    });

    if (isset($result['error'])) {
        return response()->json(['message' => $result['error']], 422);
    }

    // Terbitkan token dengan cara yang sama seperti login biasa, supaya
    // /auth/me, /auth/logout dan sinkronisasi cart tidak perlu tahu bedanya.
    return $this->issueCustomerSession($result['customer']);
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

Link ini setara password, dan WhatsApp bukan kanal rahasia: pesan bisa
di-forward, tertinggal di chat lama, atau dibuka di HP yang dipakai bersama.
Karena itu `single_use` default menyala dan `expires_in_hours` sebaiknya pendek
(24 jam untuk pemakaian normal). Jangan jadikan link ini pengganti password
permanen, dan jangan pakai untuk akun yang boleh mengubah data sensitif tanpa
konfirmasi ulang.
