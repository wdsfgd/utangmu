import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  LayoutGrid,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { SummaryCards } from '@/components/admin/SummaryCards'
import { DebtorCard } from '@/components/admin/DebtorCard'
import { AddDebtorModal } from '@/components/admin/AddDebtorModal'
import { AddTransactionModal } from '@/components/admin/AddTransactionModal'
import { DebtorDetailModal } from '@/components/admin/DebtorDetailModal'
import { WhatsAppShareModal } from '@/components/admin/WhatsAppShareModal'
import { CloudShader } from '@/components/ui/cloud-shader'
import { Meteors } from '@/components/ui/meteors'
import { FlipWords } from '@/components/ui/flip-words'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Particles } from '@/components/ui/particles'
import { Spotlight } from '@/components/ui/spotlight'
import { RetroGrid } from '@/components/ui/retro-grid'
import { Marquee } from '@/components/ui/marquee'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { SparklesText } from '@/components/ui/sparkles-text'
import { FloatingDock, type FloatingDockItem } from '@/components/ui/floating-dock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatRupiah } from '@/lib/format'
import { dbService } from '@/lib/db'
import type { Debtor, TransactionType } from '@/types'

export function AdminPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'SETTLED'>('ALL')

  // Modals state
  const [isAddDebtorOpen, setIsAddDebtorOpen] = useState(false)
  const [transactionModalState, setTransactionModalState] = useState<{
    open: boolean
    debtor: Debtor | null
    type: TransactionType
  }>({
    open: false,
    debtor: null,
    type: 'BORROW',
  })
  const [detailModalDebtor, setDetailModalDebtor] = useState<Debtor | null>(null)
  const [whatsAppModalDebtor, setWhatsAppModalDebtor] = useState<Debtor | null>(null)

  const loadData = async () => {
    try {
      const data = await dbService.getDebtors()
      setDebtors(data)
    } catch (error) {
      console.error('Failed to load debtors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered and searched debtors list
  const filteredDebtors = useMemo(() => {
    return debtors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(d.phone && d.phone.includes(searchQuery))

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNPAID' && d.status === 'UNPAID') ||
        (statusFilter === 'PARTIALLY_PAID' && d.status === 'PARTIALLY_PAID') ||
        (statusFilter === 'SETTLED' && d.status === 'SETTLED')

      return matchesSearch && matchesStatus
    })
  }, [debtors, searchQuery, statusFilter])

  // Handlers
  const handleAddDebtor = async (name: string, phone: string) => {
    await dbService.createDebtor(name, phone)
    await loadData()
  }

  const handleSaveTransaction = async (params: {
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
  }) => {
    await dbService.addTransaction(params)
    await loadData()
  }

  const handleDeleteTransaction = async (txId: string) => {
    await dbService.deleteTransaction(txId)
    await loadData()
  }

  const handleDeleteDebtor = async (debtorId: string) => {
    await dbService.deleteDebtor(debtorId)
    if (detailModalDebtor?.id === debtorId) setDetailModalDebtor(null)
    await loadData()
  }

  const handleRegenerateToken = async (debtorId: string) => {
    await dbService.regenerateSecretToken(debtorId)
    await loadData()
  }

  const handleResetData = () => {
    if (confirm('Reset semua data ke contoh awal? Semua data baru lokal akan diganti.')) {
      dbService.resetToSampleData()
      loadData()
    }
  }

  // Floating dock items
  const dockItems: FloatingDockItem[] = [
    {
      title: 'Semua',
      icon: <LayoutGrid className="h-full w-full" />,
      onClick: () => setStatusFilter('ALL'),
    },
    {
      title: 'Belum Lunas',
      icon: <AlertCircle className="h-full w-full text-amber-400" />,
      onClick: () => setStatusFilter('UNPAID'),
    },
    {
      title: 'Dibayar Sebagian',
      icon: <Clock className="h-full w-full text-blue-400" />,
      onClick: () => setStatusFilter('PARTIALLY_PAID'),
    },
    {
      title: 'Lunas',
      icon: <CheckCircle2 className="h-full w-full text-emerald-400" />,
      onClick: () => setStatusFilter('SETTLED'),
    },
    {
      title: 'Tambah Teman',
      icon: <UserPlus className="h-full w-full text-emerald-300" />,
      onClick: () => setIsAddDebtorOpen(true),
    },
    {
      title: 'Reset Data',
      icon: <RefreshCw className="h-full w-full text-neutral-400" />,
      onClick: handleResetData,
    },
  ]

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 pb-28 selection:bg-emerald-500/30 overflow-hidden">
      {/* Spotlight Effect from top corners */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#10b981" />
      <Spotlight className="-top-40 right-0 md:right-40 md:-top-20" fill="#06b6d4" />

      {/* GPU WebGL Cloud Shader */}
      <CloudShader />

      {/* Interactive Floating Particles */}
      <Particles
        className="pointer-events-none absolute inset-0 z-0"
        quantity={65}
        ease={60}
        color="#10b981"
        refresh
      />

      {/* Retro 3D Grid on background bottom (Endless road) */}
      <RetroGrid className="pointer-events-none absolute bottom-0 inset-x-0 h-[450px] opacity-30" />

      {/* Meteors flying across the entire background sky above the endless road */}
      <Meteors number={40} />

      <div className="relative z-10">
        {/* Top Navbar */}
        <Navbar
          onOpenAddDebtor={() => setIsAddDebtorOpen(true)}
          onResetData={handleResetData}
          isAdmin={true}
          onToggleAdmin={() => {}}
        />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
          {/* Hero Section dengan Sparkles, FlipWords, & ShimmerButton */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-emerald-950/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <AnimatedGradientText
                    colorFrom="#10b981"
                    colorTo="#06b6d4"
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    Catatan Keuangan Real-Time
                  </AnimatedGradientText>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100">
                    Kelola
                  </h1>
                  <FlipWords
                    words={['Piutang', 'Pembayaran', 'Catatan Teman', 'Bukti Transfer']}
                    className="text-2xl sm:text-4xl font-black text-emerald-400"
                  />
                </div>
              </div>

              <ShimmerButton
                onClick={() => setIsAddDebtorOpen(true)}
                className="h-11 px-5 text-sm font-semibold shrink-0"
              >
                <Plus className="h-4 w-4 text-emerald-400 mr-2 inline" />
                <span>Tambah Teman</span>
              </ShimmerButton>
            </div>
          </div>

          {/* Activity Marquee Ticker */}
          {debtors.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md py-2">
              <Marquee pauseOnHover className="[--duration:30s]">
                {debtors.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2.5 mx-3 px-3 py-1 rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-xs"
                  >
                    <span className="font-bold text-neutral-200">{d.name}</span>
                    <span className="text-neutral-500">•</span>
                    <span className={d.status === 'SETTLED' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {d.status === 'SETTLED' ? 'LUNAS' : formatRupiah(d.remaining_balance || 0)}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-400 text-[11px]">
                      {d.transactions?.length || 0} transaksi
                    </span>
                  </div>
                ))}
              </Marquee>
            </div>
          )}

          {/* Summary Stat Cards */}
          <SummaryCards debtors={debtors} />

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Cari nama teman atau keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-neutral-900/80 border-neutral-800 text-sm h-10 rounded-xl"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="h-4 w-4 text-neutral-500 mr-1 hidden sm:block shrink-0" />
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'UNPAID', label: 'Belum Lunas' },
                { key: 'PARTIALLY_PAID', label: 'Dibayar Sebagian' },
                { key: 'SETTLED', label: 'Lunas' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-neutral-100 text-neutral-950 font-bold shadow'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Debtor Grid List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-48 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/20 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-neutral-800/80 flex items-center justify-center text-neutral-400 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-neutral-200 text-base">Tidak ada catatan ditemukan</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                {searchQuery
                  ? `Tidak ada hasil pencarian untuk "${searchQuery}".`
                  : 'Belum ada teman yang didaftarkan dalam kategori ini.'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDebtorOpen(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Tambah Teman
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDebtors.map((debtor) => (
                <DebtorCard
                  key={debtor.id}
                  debtor={debtor}
                  onAddTransaction={(d, type) =>
                    setTransactionModalState({ open: true, debtor: d, type })
                  }
                  onViewDetails={(d) => setDetailModalDebtor(d)}
                  onShareWhatsApp={(d) => setWhatsAppModalDebtor(d)}
                  onRegenerateToken={handleRegenerateToken}
                  onDeleteDebtor={handleDeleteDebtor}
                />
              ))}
            </div>
          )}
        </main>

        {/* Floating Dock Navigation at bottom center */}
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-auto">
          <FloatingDock items={dockItems} />
        </div>

        {/* Modals */}
        <AddDebtorModal
          open={isAddDebtorOpen}
          onClose={() => setIsAddDebtorOpen(false)}
          onAddDebtor={handleAddDebtor}
        />

        <AddTransactionModal
          open={transactionModalState.open}
          onClose={() =>
            setTransactionModalState({ open: false, debtor: null, type: 'BORROW' }
          )}
          debtor={transactionModalState.debtor}
          initialType={transactionModalState.type}
          onSave={handleSaveTransaction}
        />

        <DebtorDetailModal
          open={Boolean(detailModalDebtor)}
          onClose={() => setDetailModalDebtor(null)}
          debtor={detailModalDebtor}
          onAddTransaction={(d, type) => {
            setTransactionModalState({
              open: true,
              debtor: d,
              type,
            })
          }}
          onDeleteTransaction={handleDeleteTransaction}
        />

        <WhatsAppShareModal
          open={Boolean(whatsAppModalDebtor)}
          onClose={() => setWhatsAppModalDebtor(null)}
          debtor={whatsAppModalDebtor}
        />
      </div>
    </div>
  )
}
