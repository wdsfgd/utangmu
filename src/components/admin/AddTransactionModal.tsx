import { useState, useRef, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  PlusCircle,
  MinusCircle,
  Upload,
  Image as ImageIcon,
  Video,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react'
import { formatRupiah, parseAmountInput } from '@/lib/format'
import { processProofImage, type ProcessedImageResult } from '@/lib/image'
import { uploadProofFile } from '@/lib/storage'
import type { Debtor, TransactionType } from '@/types'

interface AddTransactionModalProps {
  open: boolean
  onClose: () => void
  debtor: Debtor | null
  initialType?: TransactionType
  onSave: (params: {
    debtor_id: string
    type: TransactionType
    amount: number
    description: string
    transaction_date: string
    attachment?: {
      file_url: string
      file_type: string
      file_name?: string
    }
  }) => Promise<void>
}

export function AddTransactionModal({
  open,
  onClose,
  debtor,
  initialType = 'BORROW',
  onSave,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType)
  const [rawAmount, setRawAmount] = useState('')
  const [description, setDescription] = useState('')
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<ProcessedImageResult | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setType(initialType)
      setRawAmount('')
      setDescription('')
      setTransactionDate(new Date().toISOString().split('T')[0])
      setSelectedFile(null)
      setProcessedImage(null)
      setVideoPreviewUrl(null)
      setError('')
    }
  }, [open, initialType])

  const parsedAmount = parseAmountInput(rawAmount)

  // Handle upload file (Image -> WebP+Watermark; Video -> As-is tanpa kompresi)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError('')
    setIsProcessingFile(true)

    try {
      if (file.type.startsWith('image/')) {
        // Konversi ke WebP + Watermark permanen via native canvas (0 packages)
        const result = await processProofImage({
          file,
          debtorName: debtor?.name || '',
          amountText: parsedAmount > 0 ? formatRupiah(parsedAmount) : '',
        })
        setProcessedImage(result)
        setVideoPreviewUrl(null)
      } else if (file.type.startsWith('video/')) {
        // Video: Tanpa kompresi dan tanpa batas ukuran
        const videoUrl = URL.createObjectURL(file)
        setVideoPreviewUrl(videoUrl)
        setProcessedImage(null)
      } else {
        setError('Format file tidak didukung. Harap pilih gambar atau video.')
        setSelectedFile(null)
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses file bukti.')
      setSelectedFile(null)
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setProcessedImage(null)
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
      setVideoPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debtor) return

    if (parsedAmount <= 0) {
      setError('Nominal harus lebih dari 0')
      return
    }

    if (!description.trim()) {
      setError('Keterangan transaksi wajib diisi')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      let attachmentInfo: { file_url: string; file_type: string; file_name?: string } | undefined

      if (processedImage) {
        // Upload WebP hasil kompresi + watermark
        const uploadResult = await uploadProofFile(
          processedImage.blob,
          selectedFile?.name || 'bukti.webp'
        )
        attachmentInfo = {
          file_url: uploadResult.fileUrl,
          file_type: uploadResult.fileType,
          file_name: uploadResult.fileName,
        }
      } else if (selectedFile && selectedFile.type.startsWith('video/')) {
        // Upload video as-is
        const uploadResult = await uploadProofFile(selectedFile, selectedFile.name)
        attachmentInfo = {
          file_url: uploadResult.fileUrl,
          file_type: uploadResult.fileType,
          file_name: uploadResult.fileName,
        }
      }

      await onSave({
        debtor_id: debtor.id,
        type,
        amount: parsedAmount,
        description: description.trim(),
        transaction_date: transactionDate,
        attachment: attachmentInfo,
      })

      onClose()
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan transaksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={type === 'BORROW' ? `Catat Pinjaman Baru: ${debtor?.name}` : `Catat Pembayaran: ${debtor?.name}`}
      description="Transaksi akan otomatis mengupdate sisa saldo dan langsung muncul di portal teman."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Tipe Transaksi (Borrow vs Payment) */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
          <button
            type="button"
            onClick={() => setType('BORROW')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'BORROW'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-amber-400" />
            <span>Pinjaman Baru (+)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('PAYMENT')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'PAYMENT'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MinusCircle className="h-4 w-4 text-emerald-400" />
            <span>Catat Pembayaran (-)</span>
          </button>
        </div>

        {/* Input Nominal */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Nominal Transaksi <span className="text-red-400">*</span>
            </label>
            {parsedAmount > 0 && (
              <span className="text-xs font-bold text-emerald-400">
                {formatRupiah(parsedAmount)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ketik nominal: contoh 500k, 1.5jt, atau 200000"
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
          <p className="text-[11px] text-neutral-500 mt-1">
            Mendukung format cepat: ketik <strong>500k</strong>, <strong>200rb</strong>, atau <strong>1.5jt</strong>.
          </p>
        </div>

        {/* Tanggal & Deskripsi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Tanggal Transaksi
            </label>
            <Input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Keterangan <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder={type === 'BORROW' ? 'Contoh: Pinjaman modal / beli tiket' : 'Contoh: Transfer BCA pembayaran ke-1'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Upload Bukti (Foto WebP + Watermark / Video Raw As-Is) */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-emerald-400" />
              <span>Lampiran Bukti (Foto / Video)</span>
            </span>
            <span className="text-[11px] text-neutral-500">Opsional</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
            id="proof-file-input"
            disabled={isProcessingFile || isSubmitting}
          />

          {!selectedFile ? (
            <label
              htmlFor="proof-file-input"
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-4 text-center cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/80 transition-all"
            >
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <ImageIcon className="h-5 w-5 text-emerald-400" />
                <Video className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-xs font-medium text-neutral-200">
                Pilih Foto Struk / M-Banking atau Video Bukti
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Foto otomatis dikonversi ke WebP + watermark tanggal & lokasi. Video diunggah langsung tanpa batas.
              </p>
            </label>
          ) : (
            <div className="space-y-3">
              {isProcessingFile ? (
                <div className="p-4 text-center text-xs text-neutral-400 animate-pulse">
                  Sedang memproses dan membubuhkan watermark...
                </div>
              ) : (
                <>
                  {/* Preview Gambar WebP dengan Watermark */}
                  {processedImage && (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
                      <img
                        src={processedImage.dataUrl}
                        alt="Preview Bukti"
                        className="w-full max-h-48 object-contain bg-black/40"
                      />
                      <div className="p-2.5 bg-neutral-950 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>WebP + Watermark Otentik</span>
                        </div>
                        <span className="text-neutral-400">
                          {(processedImage.originalSize / 1024).toFixed(0)} KB →{' '}
                          <strong className="text-neutral-200">
                            {(processedImage.compressedSize / 1024).toFixed(0)} KB
                          </strong>{' '}
                          (Hemat{' '}
                          {Math.round(
                            (1 - processedImage.compressedSize / processedImage.originalSize) * 100
                          )}
                          %)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Preview Video */}
                  {videoPreviewUrl && (
                    <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full max-h-48"
                      />
                      <div className="p-2 bg-neutral-950 text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>Video As-Is (Tanpa Kompresi)</span>
                        <span>{((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-neutral-300 truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-7 text-xs px-2"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Hapus File
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting || isProcessingFile}
          >
            Batal
          </Button>
          <Button
            type="submit"
            data-testid="btn-submit-tx"
            variant={type === 'BORROW' ? 'default' : 'emerald'}
            disabled={isSubmitting || isProcessingFile || parsedAmount <= 0}
            className="font-semibold"
          >
            {isSubmitting ? 'Menyimpan...' : type === 'BORROW' ? 'Simpan Pinjaman' : 'Simpan Pembayaran'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
