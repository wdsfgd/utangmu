import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, ShieldCheck } from 'lucide-react'
import type { Attachment } from '@/types'

interface ProofModalProps {
  open: boolean
  onClose: () => void
  attachment: Attachment | null
  title?: string
}

export function ProofModal({ open, onClose, attachment, title = 'Bukti Transaksi' }: ProofModalProps) {
  if (!attachment) return null

  const isVideo = attachment.file_type.startsWith('video/')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="Bukti otentik transaksi yang tersimpan di sistem."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Media Container */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center min-h-[280px] max-h-[65vh]">
          {isVideo ? (
            <video
              src={attachment.file_url}
              controls
              autoPlay
              className="max-h-[60vh] w-full object-contain"
            />
          ) : (
            <img
              src={attachment.file_url}
              alt="Bukti Transfer"
              className="max-h-[60vh] w-full object-contain"
            />
          )}
        </div>

        {/* Info & Download Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">
                {attachment.file_name || (isVideo ? 'Video Bukti' : 'Foto Bukti WebP')}
              </p>
              <p className="text-[11px] text-neutral-400">
                Format: <span className="font-mono text-neutral-300">{attachment.file_type}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={attachment.file_url}
              download={attachment.file_name || 'bukti_utangmu'}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="secondary" className="h-8 text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Unduh File
              </Button>
            </a>
            <a
              href={attachment.file_url}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Tab Baru
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
