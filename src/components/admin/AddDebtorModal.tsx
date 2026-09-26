import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus } from 'lucide-react'

interface AddDebtorModalProps {
  open: boolean
  onClose: () => void
  onAddDebtor: (name: string, phone: string) => Promise<void>
}

export function AddDebtorModal({ open, onClose, onAddDebtor }: AddDebtorModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nama teman wajib diisi')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onAddDebtor(name.trim(), phone.trim())
      setName('')
      setPhone('')
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan teman')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tambah Teman Baru"
      description="Buat catatan akun untuk teman yang meminjam. Link portal khusus akan digenerate otomatis."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            Nama Teman / Panggilan <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="Contoh: Mas, Rian, Budi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            Nomor WhatsApp (Opsional)
          </label>
          <Input
            placeholder="Contoh: 081234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            Untuk memudahkan kirim rekapan tagihan via WhatsApp.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="emerald" disabled={loading}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            {loading ? 'Menyimpan...' : 'Simpan Teman'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
