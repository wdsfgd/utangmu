import { User, Database, RefreshCw, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/db'

interface NavbarProps {
  onOpenAddDebtor: () => void
  onResetData: () => void
  isAdmin: boolean
  onToggleAdmin: () => void
}

export function Navbar({
  onOpenAddDebtor,
  onResetData,
  isAdmin,
  onToggleAdmin,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-neutral-100">UTANGMU</span>
              <span className="rounded-md bg-neutral-800/90 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Catatan Piutang & Bukti Otentik</p>
          </div>
        </div>

        {/* Backend Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-400">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Mode Offline / Local'}</span>
          </div>

          {!isSupabaseConfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetData}
              title="Reset ke data contoh"
              className="text-xs h-8 text-neutral-400 hover:text-neutral-200"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Reset Data</span>
            </Button>
          )}

          <Button
            variant="emerald"
            size="sm"
            onClick={onOpenAddDebtor}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Teman</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleAdmin}
            className="h-8 px-2.5 text-xs"
            title={isAdmin ? 'Mode Admin Aktif' : 'Login Admin'}
          >
            {isAdmin ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <User className="h-4 w-4 text-neutral-400" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
