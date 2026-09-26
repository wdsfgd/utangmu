export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatShortNumber(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0'
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000
    return `${val % 1 === 0 ? val : val.toFixed(1)}M`
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return `${val % 1 === 0 ? val : val.toFixed(1)}jt`
  }
  if (amount >= 1_000) {
    const val = amount / 1_000
    return `${val % 1 === 0 ? val : val.toFixed(1)}k`
  }
  return amount.toString()
}

/**
 * Parsing input fleksibel dari user:
 * "500k" -> 500000
 * "1.5jt" -> 1500000
 * "200.000" / "200000" -> 200000
 */
export function parseAmountInput(input: string): number {
  if (!input) return 0
  const clean = input.trim().toLowerCase().replace(/rp\s?/g, '').replace(/\s+/g, '')

  if (clean.endsWith('jt') || clean.endsWith('m') && !clean.endsWith('rb')) {
    const num = parseFloat(clean.replace('jt', '').replace('m', '').replace(',', '.'))
    return Math.round(num * 1_000_000)
  }

  if (clean.endsWith('k') || clean.endsWith('rb')) {
    const num = parseFloat(clean.replace('k', '').replace('rb', '').replace(',', '.'))
    return Math.round(num * 1_000)
  }

  // Bersihkan titik pemisah ribuan
  const standard = clean.replace(/\./g, '').replace(/,/g, '.')
  const parsed = parseFloat(standard)
  return isNaN(parsed) ? 0 : Math.round(parsed)
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' WIB'
  } catch {
    return dateStr
  }
}

export function generateToken(length = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

export function generateWhatsAppMessage(name: string, balance: number, portalUrl: string): string {
  const sisa = formatRupiah(balance)
  return `Halo ${name}, ini rekapan catatan pinjaman/utang kamu:\n\nSisa tagihan: *${sisa}*\n\nKamu bisa cek rincian riwayat transaksi dan bukti transfernya di sini:\n${portalUrl}\n\nTerima kasih!`
}
