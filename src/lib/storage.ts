import { generateToken } from './format'

export interface UploadResult {
  fileUrl: string
  fileType: string
  fileName: string
  fileSize: number
}

// Konfigurasi R2 dari environment
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !R2_PUBLIC_URL

/**
 * Upload file bukti (foto WebP atau video raw tanpa batas/kompresi)
 */
export async function uploadProofFile(
  fileOrBlob: File | Blob,
  originalFileName?: string
): Promise<UploadResult> {
  const isVideo = fileOrBlob.type.startsWith('video/')
  const ext = isVideo
    ? originalFileName?.split('.').pop() || 'webm'
    : 'webp'

  const fileName = `proof_${Date.now()}_${generateToken(8)}.${ext}`
  const fileType = fileOrBlob.type || (isVideo ? 'video/webm' : 'image/webp')

  // Mode Mock / Offline Testing (Local Data URL / Blob URL)
  if (USE_MOCK) {
    const fileUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(fileOrBlob)
    })

    return {
      fileUrl,
      fileType,
      fileName,
      fileSize: fileOrBlob.size,
    }
  }

  // Mode Produksi Cloudflare R2
  // Upload ke R2 public endpoint atau via Cloudflare Pages Function
  try {
    const response = await fetch(`/api/upload-r2?file=${fileName}&type=${fileType}`, {
      method: 'POST',
      body: fileOrBlob,
      headers: {
        'Content-Type': fileType,
      },
    })

    if (!response.ok) {
      // Fallback jika direct function belum di-deploy: simpan Data URL
      console.warn('R2 API response not ok, fallbacking to local data url')
      const fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(fileOrBlob)
      })
      return {
        fileUrl,
        fileType,
        fileName,
        fileSize: fileOrBlob.size,
      }
    }

    const data = await response.json()
    return {
      fileUrl: data.url || `${R2_PUBLIC_URL}/${fileName}`,
      fileType,
      fileName,
      fileSize: fileOrBlob.size,
    }
  } catch (err) {
    console.error('Gagal upload ke R2, menggunakan fallback data URL:', err)
    const fileUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(fileOrBlob)
    })
    return {
      fileUrl,
      fileType,
      fileName,
      fileSize: fileOrBlob.size,
    }
  }
}
