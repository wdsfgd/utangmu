import { test, expect } from '@playwright/test'
import { Buffer } from 'node:buffer'

test.describe('Utangmu - End-to-End Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('1. Dashboard Admin: Memuat ringkasan dan data awal dengan benar', async ({ page }) => {
    await page.goto('/')

    // Verifikasi Header
    await expect(page.locator('header')).toContainText('UTANGMU')

    // Verifikasi 4 Kartu Ringkasan
    await expect(page.locator('text=Total Piutang Belum Lunas')).toBeVisible()
    await expect(page.locator('text=Total Sudah Dibayar')).toBeVisible()
    await expect(page.locator('text=Teman Berutang Aktif')).toBeVisible()

    // Verifikasi Kartu Contoh (Mas & Rian dari data awal)
    await expect(page.getByRole('heading', { name: 'Mas' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rian' })).toBeVisible()
  })

  test('2. Tambah Teman Baru: Menghasilkan token rahasia unik', async ({ page }) => {
    await page.goto('/')

    // Klik tombol "Tambah Teman"
    await page.locator('button:has-text("Tambah Teman")').first().click()

    // Isi Form
    await page.locator('input[placeholder*="Contoh: Mas"]').fill('Budi Santoso')
    await page.locator('input[placeholder*="081234567890"]').fill('081234567899')

    // Submit
    await page.locator('button:has-text("Simpan Teman")').click()

    // Verifikasi Teman Baru Muncul di Papan
    await expect(page.getByRole('heading', { name: 'Budi Santoso' })).toBeVisible()
    await expect(page.locator('text=081234567899')).toBeVisible()

    // Verifikasi Link Khusus Budi Santoso digenerate
    const budiCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Budi Santoso' }) })
    const linkInput = budiCard.locator('input[readonly]')
    const tokenUrl = await linkInput.inputValue()
    expect(tokenUrl).toContain('/view/')
  })

  test('3. Catat Pinjaman Baru dengan Format Cepat (750k) dan Hitung Saldo', async ({ page }) => {
    await page.goto('/')

    // Tambah teman Budi
    await page.locator('button:has-text("Tambah Teman")').first().click()
    await page.locator('input[placeholder*="Contoh: Mas"]').fill('Budi')
    await page.locator('button:has-text("Simpan Teman")').click()

    // Cari kartu Budi lalu klik "+ Pinjam"
    const budiCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Budi' }) })
    await budiCard.locator('[data-testid="btn-borrow"]').click()

    // Input nominal 750k (menguji parser format fleksibel)
    await page.locator('input[placeholder*="500k, 1.5jt"]').fill('750k')
    await expect(page.locator('text=/750\\.000/').first()).toBeVisible()

    // Isi Keterangan
    await page.locator('input[placeholder*="Pinjaman modal"]').fill('Pinjam untuk modal jualan')

    // Simpan Transaksi
    await page.locator('button:has-text("Simpan Pinjaman")').click()

    // Verifikasi saldo Budi menjadi Rp 750.000
    await expect(budiCard.locator('[data-testid="debtor-balance"]')).toContainText('750.000')
    await expect(budiCard).toContainText('Belum Lunas')
  })

  test('4. Catat Pembayaran Cicilan (200k) dan Verifikasi Pengurangan Saldo', async ({ page }) => {
    await page.goto('/')

    // Tambah teman Doni
    await page.locator('button:has-text("Tambah Teman")').first().click()
    await page.locator('input[placeholder*="Contoh: Mas"]').fill('Doni')
    await page.locator('button:has-text("Simpan Teman")').click()

    const doniCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Doni' }) })

    // Pinjam 500k
    await doniCard.locator('[data-testid="btn-borrow"]').click()
    await page.locator('input[placeholder*="500k, 1.5jt"]').fill('500k')
    await page.locator('input[placeholder*="Pinjaman modal"]').fill('Pinjaman awal')
    await page.locator('button:has-text("Simpan Pinjaman")').click()
    await expect(doniCard.locator('[data-testid="debtor-balance"]')).toContainText('Rp 500.000')

    // Bayar cicilan 200k
    await doniCard.locator('[data-testid="btn-payment"]').click()
    await page.locator('input[placeholder*="500k, 1.5jt"]').fill('200k')
    await page.locator('input[placeholder*="Transfer BCA"]').fill('Cicilan pertama via transfer')
    await page.locator('button:has-text("Simpan Pembayaran")').click()

    // Verifikasi Sisa Saldo: Rp 500.000 - Rp 200.000 = Rp 300.000
    await expect(doniCard.locator('[data-testid="debtor-balance"]')).toContainText('Rp 300.000')
    await expect(doniCard).toContainText('Dibayar')
  })

  test('5. Portal Privat Teman (/view/:token): Hanya teman bersangkutan yang bisa melihat utangnya', async ({ page }) => {
    await page.goto('/')

    // Ambil kartu 'Mas' yang memiliki utang aktif
    const masCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Mas' }) })
    const linkInput = masCard.locator('input[readonly]')
    const portalUrl = await linkInput.inputValue()
    expect(portalUrl).toContain('/view/')

    // Buka Portal Teman Mas
    await page.goto(portalUrl)

    // Verifikasi tampilan portal personal
    await expect(page.locator('h1')).toContainText('Halo, Mas')
    await expect(page.locator('header')).toContainText('UTANGMU')

    // Verifikasi riwayat Mas tampil
    await expect(page.locator('text=Pinjaman awal modal usaha')).toBeVisible()
    await expect(page.locator('text=Cicilan transfer via BCA')).toBeVisible()

    // Verifikasi PRIVASI: Tidak boleh ada nama 'Rian' di portal Mas!
    await expect(page.locator('text=Rian')).not.toBeVisible()
    await expect(page.locator('text=Talangan beli tiket')).not.toBeVisible()

    // Verifikasi tidak ada tombol admin (tidak bisa edit atau hapus dari portal teman)
    await expect(page.locator('button:has-text("Tambah Teman")')).not.toBeVisible()
    await expect(page.locator('button:has-text("Simpan Pinjaman")')).not.toBeVisible()
  })

  test('6. Template Pesan WhatsApp: Mengenerate pesan personal dan link', async ({ page }) => {
    await page.goto('/')

    const masCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Mas' }) })
    // Klik tombol WA
    await masCard.locator('button[title*="WhatsApp"]').click()

    // Verifikasi Modal WA terbuka
    await expect(page.locator('h2:has-text("Kirim Rekapan ke Mas")')).toBeVisible()
    await expect(page.locator('text=Halo Mas, ini rekapan')).toBeVisible()
    await expect(page.locator('text=Sisa tagihan:')).toBeVisible()

    // Test tombol salin pesan
    await page.locator('button:has-text("Salin Pesan")').click()
    await expect(page.locator('text=Tersalin!')).toBeVisible()
  })

  test('7. Filter dan Pencarian Teman Berjalan Normal', async ({ page }) => {
    await page.goto('/')

    // Cari "Mas"
    await page.locator('input[placeholder*="Cari nama teman"]').fill('Mas')
    await expect(page.getByRole('heading', { name: 'Mas' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rian' })).not.toBeVisible()

    // Hapus pencarian
    await page.locator('input[placeholder*="Cari nama teman"]').fill('')
    await expect(page.getByRole('heading', { name: 'Rian' })).toBeVisible()
  })

  test('8. Upload Bukti Foto (Canvas WebP + Watermark) & Video As-Is', async ({ page }) => {
    await page.goto('/')

    // Tambah teman Bayu
    await page.locator('button:has-text("Tambah Teman")').first().click()
    await page.locator('input[placeholder*="Contoh: Mas"]').fill('Bayu')
    await page.locator('button:has-text("Simpan Teman")').click()

    const bayuCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Bayu' }) })

    // Klik + Pinjam
    await bayuCard.locator('[data-testid="btn-borrow"]').click()
    await page.locator('input[placeholder*="500k, 1.5jt"]').fill('100k')
    await page.locator('input[placeholder*="Pinjaman modal"]').fill('Pinjam uang makan')

    // Siapkan dummy file gambar PNG
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    await page.locator('input[type="file"]').setInputFiles({
      name: 'struk_test.png',
      mimeType: 'image/png',
      buffer,
    })

    // Tunggu proses WebP + watermark selesai dan label muncul
    await expect(page.locator('text=WebP + Watermark Otentik')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Hemat')).toBeVisible()

    // Simpan Transaksi
    await page.locator('button:has-text("Simpan Pinjaman")').click()

    // Buka Riwayat Bayu untuk melihat attachment
    await expect(bayuCard.locator('text=1 Bukti')).toBeVisible()
    await bayuCard.locator('button:has-text("Lihat Riwayat")').click()
    await expect(page.locator('text=Pinjam uang makan')).toBeVisible()

    // Klik thumbnail bukti untuk membuka ProofModal
    await page.locator('[data-testid="attachment-thumbnail"]').first().click()
    await expect(page.locator('h2:has-text("Bukti Transaksi - Bayu")')).toBeVisible()
    await expect(page.locator('img[alt="Bukti Transfer"]')).toBeVisible()
  })

  test('9. Pelunasan Utang (Lunas) dan Tampilan Portal Bebas Utang', async ({ page }) => {
    await page.goto('/')

    // Tambah teman Soni
    await page.locator('button:has-text("Tambah Teman")').first().click()
    await page.locator('input[placeholder*="Contoh: Mas"]').fill('Soni')
    await page.locator('button:has-text("Simpan Teman")').click()

    const soniCard = page.locator('[data-testid="debtor-card"]').filter({ has: page.getByRole('heading', { name: 'Soni' }) })

    // Pinjam 100k
    await soniCard.locator('[data-testid="btn-borrow"]').click()
    await page.locator('input[placeholder*="500k, 1.5jt"]').fill('100k')
    await page.locator('input[placeholder*="Pinjaman modal"]').fill('Pinjam pulsa')
    await page.locator('[data-testid="btn-submit-tx"]').click()
    await expect(page.locator('h2:has-text("Catat Pinjaman Baru")')).not.toBeVisible()
    await expect(soniCard.locator('[data-testid="debtor-balance"]')).toContainText('100.000')

    // Bayar lunas 100k
    await soniCard.locator('[data-testid="btn-payment"]').click()
    await expect(page.locator('h2:has-text("Catat Pembayaran")')).toBeVisible()
    await page.locator('input[placeholder*="500k, 1.5jt"]').fill('100k')
    await page.locator('input[placeholder*="Transfer BCA"]').fill('Bayar lunas')
    await page.locator('[data-testid="btn-submit-tx"]').click()
    await expect(page.locator('h2:has-text("Catat Pembayaran")')).not.toBeVisible()

    // Verifikasi status kartu menjadi Lunas dan saldo Rp 0
    await expect(soniCard.locator('text=Lunas')).toBeVisible()
    await expect(soniCard.locator('[data-testid="debtor-balance"]')).toContainText('0')

    // Buka Portal Soni
    const linkInput = soniCard.locator('input[readonly]')
    const portalUrl = await linkInput.inputValue()
    await page.goto(portalUrl)

    // Verifikasi pesan Lunas di portal teman
    await expect(page.getByText('🎉 LUNAS')).toBeVisible()
    await expect(page.locator('text=Alhamdulillah, semua pinjaman telah terbayar lunas!')).toBeVisible()
  })
})
