import { useState } from 'react'
import {
  Copy,
  Check,
  PlusCircle,
  MinusCircle,
  Share2,
  Receipt,
  RotateCw,
  Trash2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { CardSpotlight } from '@/components/aceternity/card-spotlight'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRupiah, formatShortNumber } from '@/lib/format'
import type { Debtor } from '@/types'

interface DebtorCardProps {
  debtor: Debtor
  onAddTransaction: (debtor: Debtor, type: 'BORROW' | 'PAYMENT') => void
  onViewDetails: (debtor: Debtor) => void
  onShareWhatsApp: (debtor: Debtor) => void
  onRegenerateToken: (debtorId: string) => Promise<void>
  onDeleteDebtor: (debtorId: string) => Promise<void>
}

export function DebtorCard({
  debtor,
  onAddTransaction,
  onViewDetails,
  onShareWhatsApp,
  onRegenerateToken,
  onDeleteDebtor,
}: DebtorCardProps) {
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const balance = debtor.remaining_balance || 0
  const isSettled = debtor.status === 'SETTLED'
  const isPartiallyPaid = debtor.status === 'PARTIALLY_PAID'

  // Total attachment count across all transactions
  const totalAttachments = (debtor.transactions || []).reduce(
    (sum, t) => sum + (t.attachments?.length || 0),
    0
  )

  const portalUrl = `${window.location.origin}/view/${debtor.secret_token}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback manual copy
      const input = document.createElement('input')
      input.value = portalUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (confirm(`Buat link rahasia baru untuk ${debtor.name}? Link lama tidak akan bisa diakses lagi.`)) {
      setIsRegenerating(true)
      try {
        await onRegenerateToken(debtor.id)
      } finally {
        setIsRegenerating(false)
      }
    }
  }

  const handleDelete = async () => {
    if (confirm(`Hapus catatan untuk ${debtor.name} beserta semua riwayat utang dan buktinya?`)) {
      await onDeleteDebtor(debtor.id)
    }
  }

  return (
    <CardSpotlight
      data-testid="debtor-card"
      className="flex flex-col justify-between border-neutral-800/80 bg-neutral-900/60 p-5 hover:border-neutral-700/80 transition-all duration-300"
    >
      <div>
        {/* Header: Name, Status Badge, & Delete */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 data-testid="debtor-name" className="font-bold text-base text-neutral-100 truncate">{debtor.name}</h3>
              {isSettled ? (
                <Badge variant="success">Lunas</Badge>
              ) : isPartiallyPaid ? (
                <Badge variant="secondary" className="bg-blue-950/60 text-blue-300 border-blue-800/60">
                  Dicicil ({formatShortNumber(debtor.total_paid || 0)})
                </Badge>
              ) : (
                <Badge variant="warning">Belum Lunas</Badge>
              )}
            </div>
            {debtor.phone && (
              <p className="text-xs text-neutral-400 mt-0.5">{debtor.phone}</p>
            )}
          </div>

          <button
            onClick={handleDelete}
            title="Hapus Teman"
            className="text-neutral-500 hover:text-red-400 p-1 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Saldo Sisa Utang */}
        <div className="mt-4 rounded-xl bg-neutral-950/70 p-3.5 border border-neutral-800/60">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-neutral-400 font-medium">Sisa Utang:</span>
            <span className="text-xs text-neutral-400">
              {debtor.total_paid ? `(Sisa ${formatShortNumber(balance)})` : ''}
            </span>
          </div>
          <p
            data-testid="debtor-balance"
            className={`text-xl font-extrabold mt-1 tracking-tight ${
              isSettled ? 'text-emerald-400' : 'text-neutral-100'
            }`}
          >
            {formatRupiah(balance)}
          </p>

          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/50">
            <span>Dipinjam: {formatRupiah(debtor.total_borrowed || 0)}</span>
            <span>Dibayar: {formatRupiah(debtor.total_paid || 0)}</span>
          </div>
        </div>

        {/* Secret Link Bar (Teman Hanya Bisa Lihat Miliknya) */}
        <div className="mt-3.5 rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              🔗 Link Khusus {debtor.name}
            </span>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="Reset token link jika link tersebar"
              className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
            >
              <RotateCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Reset Link</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={portalUrl}
              className="h-7 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2 text-[11px] text-neutral-300 select-all font-mono focus:outline-none"
            />
            <Button
              size="sm"
              variant={copied ? 'emerald' : 'secondary'}
              onClick={handleCopyLink}
              className="h-7 px-2 text-xs"
              title="Salin Link Portal"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShareWhatsApp(debtor)}
              className="h-7 px-2 text-xs text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/30"
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/80 px-2 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700 transition-colors"
              title="Buka Halaman Portal Teman"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-neutral-800/70 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            data-testid="btn-borrow"
            onClick={() => onAddTransaction(debtor, 'BORROW')}
            className="text-xs h-8.5 font-medium border-amber-900/40 text-amber-300 hover:bg-amber-950/30"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1 text-amber-400" />
            + Pinjam
          </Button>
          <Button
            size="sm"
            variant="outline"
            data-testid="btn-payment"
            onClick={() => onAddTransaction(debtor, 'PAYMENT')}
            className="text-xs h-8.5 font-medium border-emerald-900/40 text-emerald-300 hover:bg-emerald-950/30"
          >
            <MinusCircle className="h-3.5 w-3.5 mr-1 text-emerald-400" />
            + Cicil/Bayar
          </Button>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onViewDetails(debtor)}
          className="w-full text-xs h-8.5 text-neutral-200 justify-between px-3"
        >
          <span className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-neutral-400" />
            <span>Lihat Riwayat ({debtor.transactions?.length || 0})</span>
          </span>
          {totalAttachments > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
              {totalAttachments} Bukti
            </span>
          )}
        </Button>
      </div>
    </CardSpotlight>
  )
}
