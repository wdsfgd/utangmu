import { ArrowUpRight, CheckCircle2, DollarSign, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
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
      <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-neutral-900/60 to-neutral-900/80 p-5">
        <BorderBeam size={180} duration={8} colorFrom="#10b981" colorTo="#059669" />
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Total Piutang Belum Lunas
          </p>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            <NumberTicker value={totalRemaining} />
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Dari total pinjaman {formatRupiah(totalBorrowed)}
          </p>
        </div>
      </Card>

      {/* Total Sudah Dibayar */}
      <Card className="p-5 border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Total Sudah Dicicil/Lunas
          </p>
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            <NumberTicker value={totalPaid} />
          </div>
          <p className="mt-1 text-xs text-neutral-400">Uang berhasil kembali</p>
        </div>
      </Card>

      {/* Jumlah Teman Masih Berutang */}
      <Card className="p-5 border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Teman Berutang Aktif
          </p>
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            <span className="tabular-nums font-bold">{activeDebtorsCount}</span>
            <span className="text-sm font-normal text-neutral-400 ml-1.5">orang</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Dari total {debtors.length} teman terdaftar</p>
        </div>
      </Card>

      {/* Jumlah Piutang Lunas */}
      <Card className="p-5 border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Piutang Lunas
          </p>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            <span className="tabular-nums font-bold">{settledDebtorsCount}</span>
            <span className="text-sm font-normal text-neutral-400 ml-1.5">orang</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">100% terselesaikan</p>
        </div>
      </Card>
    </div>
  )
}
