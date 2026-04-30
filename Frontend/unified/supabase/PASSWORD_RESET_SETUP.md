# Password Reset Feature Setup Guide

## Overview
Fitur reset password telah ditambahkan ke aplikasi Verdanist. User dapat request reset password via email dan akan menerima link untuk mengatur password baru.

## Flow Password Reset

1. User klik "Forgot Password?" di halaman login
2. User masukkan email dan submit
3. Supabase mengirim email dengan link reset password
4. User klik link di email
5. User diarahkan ke halaman reset-password.html
6. User masukkan password baru
7. Password berhasil diupdate!

## Konfigurasi di Supabase Dashboard

### 1. Update Redirect URLs

Supabase perlu tahu URL yang diizinkan untuk redirect setelah user klik link di email.

**Langkah-langkah:**

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu **Authentication** (di sidebar kiri)
4. Klik tab **URL Configuration**
5. Tambahkan URL berikut ke **Redirect URLs**:

```
http://localhost:5500/pages/reset-password.html
http://127.0.0.1:5500/pages/reset-password.html
https://yourdomain.com/pages/reset-password.html
```

> **Note:** Sesuaikan dengan URL development/production Anda. Jika pakai Live Server di VS Code, biasanya `http://127.0.0.1:5500`

### 2. Email Template (Opsional)

Jika ingin customize email yang dikirim:

1. Di Supabase Dashboard, klik **Authentication** → **Email Templates**
2. Pilih template **Reset Password**
3. Edit template sesuai keinginan
4. Klik **Save**

Default template sudah cukup baik, tapi bisa di-customize untuk branding Verdanist.

### 3. SMTP Settings (Opsional untuk Production)

Untuk production, sebaiknya gunakan SMTP provider (SendGrid, Mailgun, AWS SES) agar email tidak masuk spam.

1. Di Supabase Dashboard, klik **Settings** → **Auth** → **SMTP**
2. Masukkan SMTP credentials Anda
3. Klik **Save**

## File yang Telah Dibuat/Modifikasi

| File | Deskripsi |
|------|-----------|
| `pages/login.html` | Ditambahkan modal "Forgot Password" dan fungsi `sendResetPasswordEmail()` |
| `pages/reset-password.html` | Halaman baru untuk user memasukkan password baru |
| `supabase/PASSWORD_RESET_SETUP.md` | Dokumentasi ini |

## Testing

1. Buka halaman login (`pages/login.html`)
2. Klik "Forgot Password?"
3. Masukkan email yang terdaftar di sistem
4. Klik "Send Link"
5. Cek inbox email (dan folder spam)
6. Klik link di email
7. Masukkan password baru
8. Coba login dengan password baru

## Troubleshooting

### Email tidak diterima
- Cek folder spam/junk
- Pastikan email address benar
- Cek SMTP settings di Supabase (jika production)

### "Invalid or expired reset link"
- Link hanya valid 1 jam
- Pastikan redirect URL sudah benar di konfigurasi Supabase
- Cek console browser untuk error detail

### "Database not connected"
- Pastikan Supabase client terinisialisasi dengan benar
- Cek console untuk error Supabase

## Keamanan

- Link reset password expire dalam 1 jam
- Password minimal 6 karakter
- Supabase menangani token security secara otomatis
- Pastikan `reset-password.html` hanya bisa diakses dengan valid recovery token

---

**Catatan:** Fitur ini menggunakan Supabase Auth built-in password reset flow. Tidak perlu backend custom.
