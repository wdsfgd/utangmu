import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Trash2,
  ExternalLink,
  Receipt,
  FileImage,
  FileVideo,
} from 'lucide-react'
import { formatRupiah, formatDate } from '@/lib/format'
import { ProofModal } from './ProofModal'
import type { Debtor, Transaction, Attachment } from '@/types'

interface DebtorDetailModalProps {
  open: boolean
  onClose: () => void
  debtor: Debtor | null
  onAddTransaction: (debtor: Debtor, type: 'BORROW' | 'PAYMENT') => void
  onDeleteTransaction: (txId: string) => Promise<void>
}

export function DebtorDetailModal({
  open,
  onClose,
  debtor,
  onAddTransaction,
  onDeleteTransaction,
}: DebtorDetailModalProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  if (!debtor) return null

  const transactions = debtor.transactions || []
  const balance = debtor.remaining_balance || 0
  const isSettled = debtor.status === 'SETTLED'
  const portalUrl = `${window.location.origin}/view/${debtor.secret_token}`

  const handleDeleteTx = async (txId: string) => {
    if (confirm('Hapus transaksi ini? Saldo akan dihitung ulang secara otomatis.')) {
      setIsDeleting(txId)
      try {
        await onDeleteTransaction(txId)
      } finally {
        setIsDeleting(null)
      }
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={`Riwayat Lengkap: ${debtor.name}`}
        description="Semua transaksi pinjaman, pembayaran cicilan, dan lampiran bukti otentik."
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-neutral-950 p-3.5 border border-neutral-800">
            <div className="text-center">
              <span className="text-[11px] text-neutral-400 block">Total Pinjam</span>
              <span className="text-sm sm:text-base font-bold text-amber-400">
                {formatRupiah(debtor.total_borrowed || 0)}
              </span>
            </div>
            <div className="text-center border-x border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Total Dicicil</span>
              <span className="text-sm sm:text-base font-bold text-blue-400">
                {formatRupiah(debtor.total_paid || 0)}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[11px] text-neutral-400 block">Sisa Utang</span>
              <span
                className={`text-sm sm:text-base font-extrabold ${
                  isSettled ? 'text-emerald-400' : 'text-neutral-100'
                }`}
              >
                {formatRupiah(balance)}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddTransaction(debtor, 'BORROW')}
                className="h-8 text-xs font-semibold border-amber-900/40 text-amber-300 hover:bg-amber-950/30"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                + Pinjam
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddTransaction(debtor, 'PAYMENT')}
                className="h-8 text-xs font-semibold border-emerald-900/40 text-emerald-300 hover:bg-emerald-950/30"
              >
                <MinusCircle className="h-3.5 w-3.5 mr-1" />
                + Bayar/Cicil
              </Button>
            </div>

            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <span>Lihat Portal Teman</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Timeline Riwayat Transaksi */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-xs text-neutral-500">
                Belum ada transaksi untuk {debtor.name}.
              </div>
            ) : (
              transactions.map((tx) => {
                const isBorrow = tx.type === 'BORROW'
                const hasAttachments = (tx.attachments || []).length > 0

                return (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3.5 hover:border-neutral-700/80 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isBorrow ? 'warning' : 'success'}
                          className="text-[10px] uppercase font-bold tracking-wider"
                        >
                          {isBorrow ? '+ Pinjaman' : '- Cicilan'}
                        </Badge>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(tx.transaction_date)}</span>
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-neutral-200 truncate">
                        {tx.description}
                      </p>

                      {/* Attachments Preview */}
                      {hasAttachments && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tx.attachments?.map((att) => {
                            const isVideo = att.file_type.startsWith('video/')
                            return (
                              <button
                                key={att.id}
                                data-testid="attachment-thumbnail"
                                onClick={() => setSelectedAttachment(att)}
                                className="group relative flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300 hover:border-emerald-500/50 hover:bg-neutral-800 transition-all"
                              >
                                {isVideo ? (
                                  <FileVideo className="h-3.5 w-3.5 text-blue-400" />
                                ) : (
                                  <FileImage className="h-3.5 w-3.5 text-emerald-400" />
                                )}
                                <span className="max-w-[120px] truncate">
                                  {att.file_name || (isVideo ? 'Video' : 'Foto WebP')}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/50">
                      <div className="text-right">
                        <span
                          className={`text-base font-extrabold tracking-tight ${
                            isBorrow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isBorrow ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        disabled={isDeleting === tx.id}
                        title="Hapus Transaksi"
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Dialog>

      {/* Modal Preview Bukti */}
      <ProofModal
        open={Boolean(selectedAttachment)}
        onClose={() => setSelectedAttachment(null)}
        attachment={selectedAttachment}
        title={`Bukti Transaksi - ${debtor.name}`}
      />
    </>
  )
}
