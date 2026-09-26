import { useState, useEffect } from 'react'
import {
  Calendar,
  CheckCircle2,
  FileImage,
  FileVideo,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { CloudShader } from '@/components/ui/cloud-shader'
import { Meteors } from '@/components/ui/meteors'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BorderBeam } from '@/components/ui/border-beam'
import { triggerSettledConfetti } from '@/components/ui/confetti'
import { Particles } from '@/components/ui/particles'
import { Spotlight } from '@/components/ui/spotlight'
import { RetroGrid } from '@/components/ui/retro-grid'
import { Ripple } from '@/components/ui/ripple'
import { SparklesText } from '@/components/ui/sparkles-text'
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
          <p className="text-xs text-neutral-400">Memuat catatan...</p>
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
            <h2 className="text-lg font-bold text-neutral-100">Catatan Tidak Ditemukan</h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              {error || 'Link ini tidak valid atau sudah diganti dengan link baru.'}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const { debtor, transactions, summary } = data
  const isSettled = summary.is_settled

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 pb-16 selection:bg-emerald-500/30 overflow-hidden">
      {/* Background visual effects */}
      <Spotlight className="-top-40 left-0 md:left-20" fill="#10b981" />
      <CloudShader />
      <Particles
        className="pointer-events-none absolute inset-0 z-0"
        quantity={50}
        ease={65}
        color="#10b981"
        refresh
      />
      <RetroGrid className="pointer-events-none absolute bottom-0 inset-x-0 h-[300px] opacity-20" />

      <div className="relative z-10">
        {/* Top Bar Header */}
        <header className="border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-neutral-950 font-black text-xs flex items-center justify-center shadow-lg shadow-emerald-500/20">
                U
              </div>
              <span className="font-extrabold text-sm tracking-tight">UTANGMU</span>
            </div>
            <span className="text-xs text-neutral-400 font-medium">{debtor.name}</span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
          {/* Greeting dengan SparklesText */}
          <div>
            <h1>
              <SparklesText
                className="text-2xl sm:text-3xl font-black text-neutral-100"
                colors={{ first: '#10b981', second: '#06b6d4' }}
              >
                Halo, {debtor.name} 👋
              </SparklesText>
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Rincian riwayat pinjaman & cicilan kamu.
            </p>
          </div>

          {/* Hero Card Saldo Sisa Utang dengan Ripple Effect */}
          <CardSpotlight
            color="#10b981"
            className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-emerald-950/30 p-6 shadow-2xl"
          >
            <Meteors number={15} />
            <BorderBeam size={220} duration={10} colorFrom="#10b981" colorTo="#06b6d4" />
            <Ripple mainCircleSize={140} numCircles={5} mainCircleOpacity={0.15} className="z-0" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Sisa Saldo
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
                {isSettled && (
                  <p className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Alhamdulillah, semua pinjaman telah terbayar lunas!</span>
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
                  <span className="text-[11px] text-neutral-400 block">Total Dicicil</span>
                  <span className="text-sm font-bold text-blue-400">
                    {formatRupiah(summary.total_paid)}
                  </span>
                </div>
              </div>
            </div>
          </CardSpotlight>

          {/* Riwayat Transaksi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-200">
                Riwayat Transaksi ({transactions.length})
              </h2>
              <span className="text-[11px] text-neutral-400">Terbaru</span>
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center text-xs text-neutral-500">
                Belum ada transaksi.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isBorrow = tx.type === 'BORROW'
                  const attachments = tx.attachments || []

                  return (
                    <CardSpotlight
                      key={tx.id}
                      color={isBorrow ? '#f59e0b' : '#10b981'}
                      className="p-4 border-neutral-800/80 bg-neutral-900/50 hover:border-neutral-700 transition-all"
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

                      {/* Lampiran Bukti */}
                      {attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-800/60">
                          <p className="text-[11px] font-semibold text-neutral-400 mb-2">
                            Bukti Transfer / Nota:
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
                                    {att.file_name || (isVideo ? 'Video' : 'Foto')}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardSpotlight>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* Modal Preview Bukti */}
        <ProofModal
          open={Boolean(selectedAttachment)}
          onClose={() => setSelectedAttachment(null)}
          attachment={selectedAttachment}
          title="Bukti Transaksi"
        />
      </div>
    </div>
  )
}
