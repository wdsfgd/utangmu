import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { SummaryCards } from '@/components/admin/SummaryCards'
import { DebtorCard } from '@/components/admin/DebtorCard'
import { AddDebtorModal } from '@/components/admin/AddDebtorModal'
import { AddTransactionModal } from '@/components/admin/AddTransactionModal'
import { DebtorDetailModal } from '@/components/admin/DebtorDetailModal'
import { WhatsAppShareModal } from '@/components/admin/WhatsAppShareModal'
import { CloudShader } from '@/components/aceternity/cloud-shader'
import { Meteors } from '@/components/aceternity/meteors'
import { MorphingText } from '@/components/magicui/morphing-text'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

      if (detailModalDebtor) {
        const updated = data.find((d) => d.id === detailModalDebtor.id)
        if (updated) setDetailModalDebtor(updated)
      }
    } catch (err) {
      console.error('Gagal memuat data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter & Search
  const filteredDebtors = useMemo(() => {
    return debtors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.phone && d.phone.includes(searchQuery))

      if (!matchesSearch) return false

      if (statusFilter === 'ALL') return true
      return d.status === statusFilter
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

  return (
    <CloudShader>
      <div className="min-h-screen text-neutral-100 pb-20 selection:bg-emerald-500/30">
        {/* Top Navbar */}
        <Navbar
          onOpenAddDebtor={() => setIsAddDebtorOpen(true)}
          onResetData={handleResetData}
          isAdmin={true}
          onToggleAdmin={() => {}}
        />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
          {/* Hero Section dengan Morphing Text & Meteors */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-900/60 to-emerald-950/20 p-6 sm:p-8 backdrop-blur-xl">
            <Meteors number={20} />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  Dashboard
                </p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100">
                    Kelola
                  </h1>
                  <MorphingText
                    texts={['Piutang', 'Cicilan', 'Catatan Teman', 'Bukti Transfer']}
                    className="h-10 text-2xl sm:text-4xl"
                  />
                </div>
              </div>

              <ShimmerButton
                onClick={() => setIsAddDebtorOpen(true)}
                className="h-11 px-5 text-sm font-semibold shrink-0"
              >
                <Plus className="h-4 w-4 text-emerald-400" />
                <span>Tambah Teman</span>
              </ShimmerButton>
            </div>
          </div>

          {/* Summary Stat Cards */}
          <SummaryCards debtors={debtors} />

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Cari nama teman atau no HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs bg-neutral-900/60 border-neutral-800"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-neutral-100 text-neutral-900 shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                Semua ({debtors.length})
              </button>
              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'UNPAID'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                Belum Dicicil
              </button>
              <button
                onClick={() => setStatusFilter('PARTIALLY_PAID')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'PARTIALLY_PAID'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                Sedang Dicicil
              </button>
              <button
                onClick={() => setStatusFilter('SETTLED')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'SETTLED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                Lunas
              </button>
            </div>
          </div>

          {/* Debtor Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400 animate-pulse">
              Memuat data...
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-300">Tidak ada data teman yang cocok</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {searchQuery ? 'Coba ganti kata kunci pencarian.' : 'Mulai dengan menambahkan catatan teman.'}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  variant="emerald"
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

        {/* Modals */}
        <AddDebtorModal
          open={isAddDebtorOpen}
          onClose={() => setIsAddDebtorOpen(false)}
          onAddDebtor={handleAddDebtor}
        />

        <AddTransactionModal
          open={transactionModalState.open}
          onClose={() =>
            setTransactionModalState({ open: false, debtor: null, type: 'BORROW' })
          }
          debtor={transactionModalState.debtor}
          initialType={transactionModalState.type}
          onSave={handleSaveTransaction}
        />

        <DebtorDetailModal
          open={Boolean(detailModalDebtor)}
          onClose={() => setDetailModalDebtor(null)}
          debtor={detailModalDebtor}
          onAddTransaction={(d, type) =>
            setTransactionModalState({ open: true, debtor: d, type })
          }
          onDeleteTransaction={handleDeleteTransaction}
        />

        <WhatsAppShareModal
          open={Boolean(whatsAppModalDebtor)}
          onClose={() => setWhatsAppModalDebtor(null)}
          debtor={whatsAppModalDebtor}
        />
      </div>
    </CloudShader>
  )
}
