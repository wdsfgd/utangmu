import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Check, MessageSquare, ExternalLink } from 'lucide-react'
import { formatRupiah, generateWhatsAppMessage } from '@/lib/format'
import type { Debtor } from '@/types'

interface WhatsAppShareModalProps {
  open: boolean
  onClose: () => void
  debtor: Debtor | null
}

export function WhatsAppShareModal({ open, onClose, debtor }: WhatsAppShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!debtor) return null

  const portalUrl = `${window.location.origin}/view/${debtor.secret_token}`
  const balance = debtor.remaining_balance || 0
  const messageText = generateWhatsAppMessage(debtor.name, balance, portalUrl)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = messageText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format link wa.me
  const cleanPhone = (debtor.phone || '').replace(/\D/g, '')
  const waTarget = cleanPhone
    ? cleanPhone.startsWith('0')
      ? '62' + cleanPhone.slice(1)
      : cleanPhone
    : ''
  const waUrl = waTarget
    ? `https://wa.me/${waTarget}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Kirim Rekapan ke ${debtor.name}`}
      description="Pesan ini menyertakan link portal rahasia agar teman hanya bisa melihat catatannya sendiri."
    >
      <div className="space-y-4">
        {/* Preview Bubble Chat */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span>Format Pesan WhatsApp:</span>
          </p>
          <div className="rounded-xl bg-neutral-950/90 border border-neutral-800 p-3.5 text-xs text-neutral-200 whitespace-pre-wrap font-sans leading-relaxed">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="secondary" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
          </Button>
          <a href={waUrl} target="_blank" rel="noreferrer">
            <Button variant="emerald" className="gap-1.5">
              <ExternalLink className="h-4 w-4" />
              <span>Buka WhatsApp</span>
            </Button>
          </a>
        </div>
      </div>
    </Dialog>
  )
}
