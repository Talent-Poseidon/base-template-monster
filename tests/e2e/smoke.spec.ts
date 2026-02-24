import { test, expect } from '@playwright/test';

test('smoke test: login page loads correctly', async ({ page }) => {
  // Buka halaman login
  await page.goto('/auth/login');

  // Verifikasi judul halaman atau elemen kunci
  // Pastikan ada elemen yang menandakan halaman login berhasil dimuat
  // Misalnya heading "Login" atau form login
  
  // Mencari heading level 1 dengan nama "Login" atau teks serupa
  // Sesuaikan selector ini dengan implementasi halaman login Anda
  // Jika tidak yakin, kita bisa gunakan cek title halaman atau URL
  
  // Cek URL harus mengandung /auth/login
  await expect(page).toHaveURL(/.*\/auth\/login/);
  
  // Cek title halaman (opsional, sesuaikan dengan metadata layout)
  // await expect(page).toHaveTitle(/Login/);

  // Cek keberadaan elemen form login
  // Gunakan selector yang lebih spesifik agar tidak ambigu dengan form lain (misal form social login)
  // Kita cari form yang memiliki input password atau tombol submit
  const loginForm = page.locator('form').filter({ hasText: 'Sign in' }).first();
  await expect(loginForm).toBeVisible();

  // Verifikasi elemen kunci lainnya untuk memastikan render sempurna
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
