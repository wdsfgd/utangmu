import { useState, useEffect } from 'react'
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  FileImage,
  FileVideo,
  ShieldCheck,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Share2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { triggerSettledConfetti } from '@/components/magicui/confetti'
import { ProofModal } from '@/components/admin/ProofModal'
import { formatRupiah, formatDate } from '@/lib/format'
import { dbService } from '@/lib/db'
import type { PortalData, Attachment } from '@/types'

interface PortalPageProps {
  token: string
}

export function PortalPage({ token }: PortalPageProps) {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)

  useEffect(() => {
    async function loadPortal() {
      setLoading(true)
      setError(null)
      try {
        const result = await dbService.getPortalDataByToken(token)
        if (!result) {
          setError('Catatan tidak ditemukan atau link ini telah direset oleh pemilik catatan.')
        } else {
          setData(result)
          if (result.summary.is_settled) {
            // Trigger confetti saat utang sudah lunas
            setTimeout(() => triggerSettledConfetti(), 500)
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat catatan.')
      } finally {
        setLoading(false)
      }
    }

    loadPortal()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400">Memuat rincian catatan kamu...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
        <Card className="max-w-md w-full p-6 text-center space-y-4 border-red-500/30 bg-neutral-900/80">
          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Akses Terbatas</h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              {error || 'Link ini tidak valid atau sudah diganti dengan link baru oleh temanmu.'}
            </p>
          </div>
          <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
            Hubungi temanmu yang mencatat untuk meminta tautan portal terbaru.
          </p>
        </Card>
      </div>
    )
  }

  const { debtor, transactions, summary } = data
  const isSettled = summary.is_settled

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-16 selection:bg-emerald-500/30">
      {/* Top Bar Portal Teman */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 text-neutral-950 font-black text-xs flex items-center justify-center">
              U
            </div>
            <span className="font-extrabold text-sm tracking-tight">UTANGMU</span>
            <span className="text-[10px] text-neutral-400 font-medium px-1.5 py-0.5 rounded bg-neutral-800">
              Portal Pribadi
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px]">Privat & Terenkripsi</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Sapaan Personal */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-100">
            Halo, {debtor.name} 👋
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Ini adalah ringkasan transparan riwayat pinjaman & cicilan kamu.
          </p>
        </div>

        {/* Hero Card Saldo Sisa Utang */}
        <Card className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-emerald-950/30 p-6 shadow-2xl">
          <BorderBeam size={220} duration={10} colorFrom="#10b981" colorTo="#06b6d4" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Sisa Saldo Tagihan
            </span>
            {isSettled ? (
              <Badge variant="success" className="text-xs px-2.5 py-0.5">
                🎉 LUNAS
              </Badge>
            ) : summary.total_paid > 0 ? (
              <Badge variant="secondary" className="bg-blue-950 text-blue-300 border-blue-800 text-xs">
                Sedang Dicicil
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs">
                Belum Dicicil
              </Badge>
            )}
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100">
              <NumberTicker value={summary.remaining_balance} />
            </div>
            {isSettled ? (
              <p className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Alhamdulillah, semua pinjaman telah terbayar lunas!</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                Sisa yang perlu diselesaikan.
              </p>
            )}
          </div>

          {/* Rincian Total Pinjam vs Total Bayar */}
          <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800/80">
            <div>
              <span className="text-[11px] text-neutral-400 block">Total Dipinjam</span>
              <span className="text-sm font-bold text-amber-400">
                {formatRupiah(summary.total_borrowed)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Total Sudah Dicicil</span>
              <span className="text-sm font-bold text-blue-400">
                {formatRupiah(summary.total_paid)}
              </span>
            </div>
          </div>
        </Card>

        {/* Riwayat Transaksi & Bukti */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-200">
              Riwayat Transaksi & Bukti Otentik ({transactions.length})
            </h2>
            <span className="text-[11px] text-neutral-400">Urut terbaru</span>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center text-xs text-neutral-500">
              Belum ada riwayat transaksi yang dicatat.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isBorrow = tx.type === 'BORROW'
                const attachments = tx.attachments || []

                return (
                  <Card
                    key={tx.id}
                    className="p-4 border-neutral-800/90 bg-neutral-900/50 hover:border-neutral-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={isBorrow ? 'warning' : 'success'}
                            className="text-[10px] uppercase font-bold"
                          >
                            {isBorrow ? (
                              <span className="flex items-center gap-1">
                                <ArrowDownLeft className="h-3 w-3" />
                                <span>Pinjaman</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>Pembayaran</span>
                              </span>
                            )}
                          </Badge>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(tx.transaction_date)}</span>
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-neutral-200">
                          {tx.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-base font-extrabold tracking-tight ${
                            isBorrow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isBorrow ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Lampiran Bukti Otentik */}
                    {attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-800/60">
                        <p className="text-[11px] font-semibold text-neutral-400 mb-2">
                          Lampiran Bukti Transfer/Nota:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((att) => {
                            const isVideo = att.file_type.startsWith('video/')
                            return (
                              <button
                                key={att.id}
                                onClick={() => setSelectedAttachment(att)}
                                className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 hover:border-emerald-500/50 hover:bg-neutral-800 transition-all text-left"
                              >
                                {isVideo ? (
                                  <FileVideo className="h-4 w-4 text-blue-400 shrink-0" />
                                ) : (
                                  <FileImage className="h-4 w-4 text-emerald-400 shrink-0" />
                                )}
                                <span className="max-w-[150px] truncate text-[11px]">
                                  {att.file_name || (isVideo ? 'Video Bukti' : 'Foto Struk WebP')}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 text-center text-xs text-neutral-400">
          <p className="text-[11px] text-neutral-400">
            Halaman ini hanya dapat diakses melalui link rahasia kamu. Simpan link ini jika ingin mengecek riwayat pembayaran di kemudian hari.
          </p>
        </div>
      </main>

      {/* Modal Preview Bukti */}
      <ProofModal
        open={Boolean(selectedAttachment)}
        onClose={() => setSelectedAttachment(null)}
        attachment={selectedAttachment}
        title="Bukti Transaksi Otentik"
      />
    </div>
  )
}
