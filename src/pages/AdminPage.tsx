import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Filter, AlertCircle, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { SummaryCards } from '@/components/admin/SummaryCards'
import { DebtorCard } from '@/components/admin/DebtorCard'
import { AddDebtorModal } from '@/components/admin/AddDebtorModal'
import { AddTransactionModal } from '@/components/admin/AddTransactionModal'
import { DebtorDetailModal } from '@/components/admin/DebtorDetailModal'
import { WhatsAppShareModal } from '@/components/admin/WhatsAppShareModal'
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

      // Sync active debtor in detail modal if open
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20 selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <Navbar
        onOpenAddDebtor={() => setIsAddDebtorOpen(true)}
        onResetData={handleResetData}
        isAdmin={true}
        onToggleAdmin={() => {}}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner Selamat Datang & Penjelasan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-100 flex items-center gap-2">
              <span>Papan Catatan Piutang</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                Privat & Otentik
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Tiap teman memiliki link portal rahasia tersendiri. Mereka hanya bisa melihat riwayat & bukti miliknya sendiri tanpa bisa melihat teman yang lain.
            </p>
          </div>

          <Button
            variant="emerald"
            onClick={() => setIsAddDebtorOpen(true)}
            className="shrink-0 font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Teman</span>
          </Button>
        </div>

        {/* 4 Summary Stat Cards */}
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
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              Semua ({debtors.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'UNPAID'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              Belum Dicicil
            </button>
            <button
              onClick={() => setStatusFilter('PARTIALLY_PAID')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'PARTIALLY_PAID'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              Sedang Dicicil
            </button>
            <button
              onClick={() => setStatusFilter('SETTLED')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'SETTLED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              Lunas
            </button>
          </div>
        </div>

        {/* Debtor Cards Grid (Trello-Replacement) */}
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 animate-pulse">
            Memuat data catatan utang...
          </div>
        ) : filteredDebtors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto">
              <Filter className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-300">Tidak ada data teman yang cocok</p>
              <p className="text-xs text-neutral-500 mt-1">
                {searchQuery ? 'Coba ganti kata kunci pencarian.' : 'Mulai dengan menambahkan catatan teman baru.'}
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
                Tambah Teman Pertama
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

      {/* Modal Tambah Teman */}
      <AddDebtorModal
        open={isAddDebtorOpen}
        onClose={() => setIsAddDebtorOpen(false)}
        onAddDebtor={handleAddDebtor}
      />

      {/* Modal Tambah Transaksi (Pinjam / Bayar + Bukti WebP / Video) */}
      <AddTransactionModal
        open={transactionModalState.open}
        onClose={() =>
          setTransactionModalState({ open: false, debtor: null, type: 'BORROW' })
        }
        debtor={transactionModalState.debtor}
        initialType={transactionModalState.type}
        onSave={handleSaveTransaction}
      />

      {/* Modal Rincian & Riwayat Lengkap Teman */}
      <DebtorDetailModal
        open={Boolean(detailModalDebtor)}
        onClose={() => setDetailModalDebtor(null)}
        debtor={detailModalDebtor}
        onAddTransaction={(d, type) =>
          setTransactionModalState({ open: true, debtor: d, type })
        }
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Modal Share WhatsApp */}
      <WhatsAppShareModal
        open={Boolean(whatsAppModalDebtor)}
        onClose={() => setWhatsAppModalDebtor(null)}
        debtor={whatsAppModalDebtor}
      />
    </div>
  )
}
