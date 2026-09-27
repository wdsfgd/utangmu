import { ArrowUpRight, CheckCircle2, DollarSign, Users } from 'lucide-react'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { NumberTicker } from '@/components/ui/number-ticker'
import { formatRupiah } from '@/lib/format'
import type { Debtor } from '@/types'

interface SummaryCardsProps {
  debtors: Debtor[]
}

export function SummaryCards({ debtors }: SummaryCardsProps) {
  const totalRemaining = debtors.reduce((sum, d) => sum + (d.remaining_balance || 0), 0)
  const totalPaid = debtors.reduce((sum, d) => sum + (d.total_paid || 0), 0)
  const totalBorrowed = debtors.reduce((sum, d) => sum + (d.total_borrowed || 0), 0)
  const activeDebtorsCount = debtors.filter((d) => (d.remaining_balance || 0) > 0).length
  const settledDebtorsCount = debtors.filter((d) => d.status === 'SETTLED').length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Piutang Aktif (Hero Card) */}
      <CardSpotlight
        color="#10b981"
        className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-neutral-900/60 to-neutral-900/80 p-5"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Total Piutang Belum Lunas
          </p>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-neutral-400">Rp</span>
            <NumberTicker value={totalRemaining} />
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Dari total pinjaman {formatRupiah(totalBorrowed)}
          </p>
        </div>
      </CardSpotlight>

      {/* Total Sudah Dibayar */}
      <CardSpotlight
        color="#3b82f6"
        className="p-5 border-neutral-800/80 bg-neutral-900/40"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Total Sudah Dibayar
          </p>
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-neutral-400">Rp</span>
            <NumberTicker value={totalPaid} />
          </div>
          <p className="mt-1 text-xs text-neutral-400">Uang kembali</p>
        </div>
      </CardSpotlight>

      {/* Jumlah Teman Masih Berutang */}
      <CardSpotlight
        color="#f59e0b"
        className="p-5 border-neutral-800/80 bg-neutral-900/40"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Teman Berutang Aktif
          </p>
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100 flex items-baseline gap-1">
            <NumberTicker value={activeDebtorsCount} />
            <span className="text-sm font-normal text-neutral-400 ml-1">orang</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Masih memiliki utang</p>
        </div>
      </CardSpotlight>

      {/* Sudah Lunas */}
      <CardSpotlight
        color="#10b981"
        className="p-5 border-neutral-800/80 bg-neutral-900/40"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Sudah Lunas
          </p>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100 flex items-baseline gap-1">
            <NumberTicker value={settledDebtorsCount} />
            <span className="text-sm font-normal text-neutral-400 ml-1">orang</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Bebas utang</p>
        </div>
      </CardSpotlight>
    </div>
  )
}
