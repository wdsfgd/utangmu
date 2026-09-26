import { RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShimmerButton } from '@/components/ui/shimmer-button'
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
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-neutral-950 font-black text-lg shadow-lg shadow-emerald-500/20">
            U
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-lg text-neutral-100">UTANGMU</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-neutral-600'
              }`}
              title={isSupabaseConfigured ? 'Supabase aktif' : 'Local storage'}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isSupabaseConfigured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetData}
              title="Reset data contoh"
              className="text-xs h-8 text-neutral-400 hover:text-neutral-200"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          <ShimmerButton
            onClick={onOpenAddDebtor}
            className="h-9 px-3.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Tambah Teman</span>
          </ShimmerButton>
        </div>
      </div>
    </header>
  )
}
