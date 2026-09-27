export interface ProcessImageOptions {
  file: File
  debtorName?: string
  amountText?: string
  maxWidth?: number
  quality?: number
}

export interface ProcessedImageResult {
  blob: Blob
  dataUrl: string
  originalSize: number
  compressedSize: number
  width: number
  height: number
  watermarkText: string
}

/**
 * Mendapatkan lokasi GPS dari browser jika diizinkan
 */
export async function getBrowserLocation(): Promise<string> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return 'GPS: Tidak didukung'
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve('GPS: Timeout')
    }, 4000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout)
        const lat = pos.coords.latitude.toFixed(4)
        const lon = pos.coords.longitude.toFixed(4)
        resolve(`GPS: ${lat}, ${lon}`)
      },
      () => {
        clearTimeout(timeout)
        resolve('GPS: Izin ditolak')
      },
      { timeout: 3500, enableHighAccuracy: false }
    )
  })
}

/**
 * Mengubah gambar ke WebP dan membubuhkan Watermark lengkap menggunakan HTML5 Canvas native (0 packages)
 */
export async function processProofImage({
  file,
  debtorName = '',
  amountText = '',
  maxWidth = 1200,
  quality = 0.82,
}: ProcessImageOptions): Promise<ProcessedImageResult> {
  const originalSize = file.size

  // 1. Dapatkan lokasi secara paralel (atau fallback)
  const locationText = await getBrowserLocation()

  // 2. Baca file gambar menggunakan ImageBitmap atau HTMLImageElement
  let imageBitmap: ImageBitmap | HTMLImageElement
  try {
    imageBitmap = await createImageBitmap(file)
  } catch {
    // Fallback untuk browser yang butuh standard HTMLImageElement
    imageBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // 3. Hitung dimensi proporsional (max width 1200px)
  let { width, height } = imageBitmap
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  // 4. Buat canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Gagal menginisialisasi canvas browser')

  // Gambar foto asli
  ctx.drawImage(imageBitmap, 0, 0, width, height)

  // 5. Siapkan Teks Watermark
  const now = new Date()
  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now)

  const line1 = `${dateFormatted} WIB | Lokasi: ${locationText}`
  const line2 = `BUKTI TRANSAKSI UTANGMU ${debtorName ? `• ${debtorName}` : ''} ${amountText ? `• ${amountText}` : ''}`
  const watermarkText = `${line1}\n${line2}`

  // 6. Gambar Watermark Bar semi-transparan di bagian bawah
  const fontSize = Math.max(12, Math.floor(width * 0.024))
  const padding = Math.floor(fontSize * 0.8)
  const barHeight = fontSize * 3.2 + padding * 2

  // Background overlay
  ctx.fillStyle = 'rgba(10, 10, 12, 0.78)'
  ctx.fillRect(0, height - barHeight, width, barHeight)

  // Accent border line di atas bar
  ctx.fillStyle = 'rgba(16, 185, 129, 0.9)' // emerald
  ctx.fillRect(0, height - barHeight, width, Math.max(2, Math.floor(fontSize * 0.15)))

  // Gambar Teks Baris 1
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'
  ctx.fillText(line1, padding, height - barHeight + padding + 4)

  // Gambar Teks Baris 2
  ctx.font = `500 ${Math.floor(fontSize * 0.9)}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#a1a1aa' // neutral-400
  ctx.fillText(line2, padding, height - barHeight + padding + fontSize * 1.5 + 4)

  // 7. Konversi Canvas ke Blob WebP
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error('Gagal mengubah format ke WebP'))
      },
      'image/webp',
      quality
    )
  })

  const dataUrl = canvas.toDataURL('image/webp', quality)

  return {
    blob,
    dataUrl,
    originalSize,
    compressedSize: blob.size,
    width,
    height,
    watermarkText,
  }
}
