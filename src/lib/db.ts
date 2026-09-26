import { createClient } from '@supabase/supabase-js'
import type { Debtor, Transaction, Attachment, PortalData, DebtorStatus } from '@/types'
import { generateToken } from './format'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
  import.meta.env.VITE_USE_MOCK !== 'true'
)

// Supabase client instance
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// ==============================================================================
// LOCAL STORAGE MOCK DATABASE (Untuk Testing & Demo Offline Tanpa Backend)
// ==============================================================================
const STORAGE_KEY_DEBTORS = 'utangmu_mock_debtors_v1'
const STORAGE_KEY_TRANSACTIONS = 'utangmu_mock_transactions_v1'
const STORAGE_KEY_ATTACHMENTS = 'utangmu_mock_attachments_v1'
const STORAGE_KEY_AUTH = 'utangmu_mock_auth_v1'

// Data inisial jika storage masih kosong (terinspirasi dari board Trello user)
function getInitialMockData(): {
  debtors: Debtor[]
  transactions: Transaction[]
  attachments: Attachment[]
} {
  const debtorMasId = 'debtor-mas-001'
  const debtorRianId = 'debtor-rian-002'

  const debtors: Debtor[] = [
    {
      id: debtorMasId,
      name: 'Mas',
      phone: '081234567890',
      secret_token: 'mas_secret_tok_7f9a1',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: debtorRianId,
      name: 'Rian',
      phone: '085799887766',
      secret_token: 'rian_secret_tok_8e2b4',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'tx-mas-001',
      debtor_id: debtorMasId,
      type: 'BORROW',
      amount: 500000,
      description: 'Pinjaman awal modal usaha',
      transaction_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'tx-mas-002',
      debtor_id: debtorMasId,
      type: 'PAYMENT',
      amount: 300000,
      description: 'Cicilan transfer via BCA (sisa 200k)',
      transaction_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'tx-rian-001',
      debtor_id: debtorRianId,
      type: 'BORROW',
      amount: 250000,
      description: 'Talangan beli tiket',
      transaction_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ]

  const attachments: Attachment[] = [
    {
      id: 'att-mas-001',
      transaction_id: 'tx-mas-002',
      file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      file_type: 'image/webp',
      file_name: 'struk_bca_300k.webp',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ]

  return { debtors, transactions, attachments }
}

function loadLocalState() {
  let debtors: Debtor[] = []
  let transactions: Transaction[] = []
  let attachments: Attachment[] = []

  try {
    const rawDebtors = localStorage.getItem(STORAGE_KEY_DEBTORS)
    const rawTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS)
    const rawAtt = localStorage.getItem(STORAGE_KEY_ATTACHMENTS)

    if (rawDebtors && rawTx) {
      debtors = JSON.parse(rawDebtors)
      transactions = JSON.parse(rawTx)
      attachments = rawAtt ? JSON.parse(rawAtt) : []
    } else {
      const initial = getInitialMockData()
      debtors = initial.debtors
      transactions = initial.transactions
      attachments = initial.attachments
      saveLocalState(debtors, transactions, attachments)
    }
  } catch {
    const initial = getInitialMockData()
    debtors = initial.debtors
    transactions = initial.transactions
    attachments = initial.attachments
  }

  return { debtors, transactions, attachments }
}

function saveLocalState(
  debtors: Debtor[],
  transactions: Transaction[],
  attachments: Attachment[]
) {
  try {
    localStorage.setItem(STORAGE_KEY_DEBTORS, JSON.stringify(debtors))
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions))
    localStorage.setItem(STORAGE_KEY_ATTACHMENTS, JSON.stringify(attachments))
  } catch (e) {
    console.error('Error saving local state:', e)
  }
}

// ==============================================================================
// COMPUTATION HELPERS
// ==============================================================================
export function computeDebtorStats(
  debtor: Debtor,
  allTransactions: Transaction[],
  allAttachments: Attachment[]
): Debtor {
  const debtorTx = allTransactions.filter((t) => t.debtor_id === debtor.id)

  const debtorTxWithAttachments = debtorTx.map((tx) => ({
    ...tx,
    attachments: allAttachments.filter((a) => a.transaction_id === tx.id),
  }))

  const total_borrowed = debtorTx
    .filter((t) => t.type === 'BORROW')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const total_paid = debtorTx
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const remaining_balance = Math.max(0, total_borrowed - total_paid)

  let status: DebtorStatus = 'UNPAID'
  if (remaining_balance === 0 && total_borrowed > 0) {
    status = 'SETTLED'
  } else if (total_paid > 0 && remaining_balance > 0) {
    status = 'PARTIALLY_PAID'
  }

  return {
    ...debtor,
    total_borrowed,
    total_paid,
    remaining_balance,
    status,
    transactions: debtorTxWithAttachments.sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    ),
  }
}

// ==============================================================================
// PUBLIC DATABASE SERVICE API
// ==============================================================================
export const dbService = {
  /**
   * Mengambil semua daftar teman (Debtor) dengan kalkulasi saldo dan transaksi
   */
  async getDebtors(): Promise<Debtor[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: debtors, error } = await supabase
        .from('debtors')
        .select(`
          *,
          transactions (
            *,
            attachments (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (debtors || []).map((d: any) => {
        const txList: Transaction[] = d.transactions || []
        const total_borrowed = txList
          .filter((t) => t.type === 'BORROW')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const total_paid = txList
          .filter((t) => t.type === 'PAYMENT')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const remaining_balance = Math.max(0, total_borrowed - total_paid)

        let status: DebtorStatus = 'UNPAID'
        if (remaining_balance === 0 && total_borrowed > 0) {
          status = 'SETTLED'
        } else if (total_paid > 0 && remaining_balance > 0) {
          status = 'PARTIALLY_PAID'
        }

        return {
          id: d.id,
          name: d.name,
          phone: d.phone,
          secret_token: d.secret_token,
          created_at: d.created_at,
          updated_at: d.updated_at,
          total_borrowed,
          total_paid,
          remaining_balance,
          status,
          transactions: txList.sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          ),
        }
      })
    }

    // Mock Mode
    const { debtors, transactions, attachments } = loadLocalState()
    return debtors.map((d) => computeDebtorStats(d, transactions, attachments))
  },

  /**
   * Menambah teman baru
   */
  async createDebtor(name: string, phone?: string): Promise<Debtor> {
    const token = generateToken(24)

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('debtors')
        .insert({
          name: name.trim(),
          phone: phone?.trim() || null,
          secret_token: token,
        })
        .select()
        .single()

      if (error) throw error
      return {
        ...data,
        total_borrowed: 0,
        total_paid: 0,
        remaining_balance: 0,
        status: 'UNPAID',
        transactions: [],
      }
    }

    // Mock Mode
    const { debtors, transactions, attachments } = loadLocalState()
    const newDebtor: Debtor = {
      id: `debtor-${Date.now()}-${generateToken(6)}`,
      name: name.trim(),
      phone: phone?.trim() || '',
      secret_token: token,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_borrowed: 0,
      total_paid: 0,
      remaining_balance: 0,
      status: 'UNPAID',
      transactions: [],
    }

    debtors.unshift(newDebtor)
    saveLocalState(debtors, transactions, attachments)
    return newDebtor
  },

  /**
   * Regenerate secret link untuk teman
   */
  async regenerateSecretToken(debtorId: string): Promise<string> {
    const newToken = generateToken(24)

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('debtors')
        .update({ secret_token: newToken, updated_at: new Date().toISOString() })
        .eq('id', debtorId)

      if (error) throw error
      return newToken
    }

    // Mock Mode
    const { debtors, transactions, attachments } = loadLocalState()
    const idx = debtors.findIndex((d) => d.id === debtorId)
    if (idx !== -1) {
      debtors[idx].secret_token = newToken
      debtors[idx].updated_at = new Date().toISOString()
      saveLocalState(debtors, transactions, attachments)
    }
    return newToken
  },

  /**
   * Hapus teman beserta semua riwayat transaksinya
   */
  async deleteDebtor(debtorId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('debtors').delete().eq('id', debtorId)
      if (error) throw error
      return
    }

    // Mock Mode
    let { debtors, transactions, attachments } = loadLocalState()
    const txIdsToDelete = transactions
      .filter((t) => t.debtor_id === debtorId)
      .map((t) => t.id)

    debtors = debtors.filter((d) => d.id !== debtorId)
    transactions = transactions.filter((t) => t.debtor_id !== debtorId)
    attachments = attachments.filter((a) => !txIdsToDelete.includes(a.transaction_id))

    saveLocalState(debtors, transactions, attachments)
  },

  /**
   * Menambah transaksi baru (Pinjaman atau Cicilan/Pembayaran) beserta lampiran bukti
   */
  async addTransaction(params: {
    debtor_id: string
    type: 'BORROW' | 'PAYMENT'
    amount: number
    description: string
    transaction_date: string
    attachment?: {
      file_url: string
      file_type: string
      file_name?: string
    }
  }): Promise<Transaction> {
    if (isSupabaseConfigured && supabase) {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          debtor_id: params.debtor_id,
          type: params.type,
          amount: params.amount,
          description: params.description.trim(),
          transaction_date: params.transaction_date,
        })
        .select()
        .single()

      if (txError) throw txError

      let createdAttachment: Attachment | undefined
      if (params.attachment) {
        const { data: att, error: attError } = await supabase
          .from('attachments')
          .insert({
            transaction_id: tx.id,
            file_url: params.attachment.file_url,
            file_type: params.attachment.file_type,
            file_name: params.attachment.file_name,
          })
          .select()
          .single()

        if (!attError && att) {
          createdAttachment = att
        }
      }

      return {
        ...tx,
        attachments: createdAttachment ? [createdAttachment] : [],
      }
    }

    // Mock Mode
    const { debtors, transactions, attachments } = loadLocalState()
    const txId = `tx-${Date.now()}-${generateToken(6)}`

    const newTx: Transaction = {
      id: txId,
      debtor_id: params.debtor_id,
      type: params.type,
      amount: params.amount,
      description: params.description.trim(),
      transaction_date: params.transaction_date,
      created_at: new Date().toISOString(),
      attachments: [],
    }

    if (params.attachment) {
      const newAtt: Attachment = {
        id: `att-${Date.now()}-${generateToken(6)}`,
        transaction_id: txId,
        file_url: params.attachment.file_url,
        file_type: params.attachment.file_type,
        file_name: params.attachment.file_name,
        created_at: new Date().toISOString(),
      }
      attachments.push(newAtt)
      newTx.attachments = [newAtt]
    }

    transactions.unshift(newTx)
    saveLocalState(debtors, transactions, attachments)
    return newTx
  },

  /**
   * Hapus satu transaksi
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('transactions').delete().eq('id', transactionId)
      if (error) throw error
      return
    }

    // Mock Mode
    let { debtors, transactions, attachments } = loadLocalState()
    transactions = transactions.filter((t) => t.id !== transactionId)
    attachments = attachments.filter((a) => a.transaction_id !== transactionId)
    saveLocalState(debtors, transactions, attachments)
  },

  /**
   * Mengambil data portal publik teman menggunakan secret_token
   * Hanya mengembalikan data teman bersangkutan, orang lain tidak bisa lihat!
   */
  async getPortalDataByToken(token: string): Promise<PortalData | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('get_portal_data', { p_token: token })
      if (error || !data) return null

      const txList: Transaction[] = data.transactions || []
      const total_borrowed = txList
        .filter((t) => t.type === 'BORROW')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const total_paid = txList
        .filter((t) => t.type === 'PAYMENT')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const remaining_balance = Math.max(0, total_borrowed - total_paid)

      return {
        debtor: data.debtor,
        transactions: txList,
        summary: {
          total_borrowed,
          total_paid,
          remaining_balance,
          is_settled: remaining_balance === 0 && total_borrowed > 0,
        },
      }
    }

    // Mock Mode
    const { debtors, transactions, attachments } = loadLocalState()
    const targetDebtor = debtors.find((d) => d.secret_token === token)
    if (!targetDebtor) return null

    const stats = computeDebtorStats(targetDebtor, transactions, attachments)
    return {
      debtor: {
        id: targetDebtor.id,
        name: targetDebtor.name,
        phone: targetDebtor.phone,
        created_at: targetDebtor.created_at,
      },
      transactions: stats.transactions || [],
      summary: {
        total_borrowed: stats.total_borrowed || 0,
        total_paid: stats.total_paid || 0,
        remaining_balance: stats.remaining_balance || 0,
        is_settled: (stats.remaining_balance || 0) === 0 && (stats.total_borrowed || 0) > 0,
      },
    }
  },

  /**
   * Reset local storage ke contoh awal (untuk demo atau testing)
   */
  resetToSampleData(): void {
    const initial = getInitialMockData()
    saveLocalState(initial.debtors, initial.transactions, initial.attachments)
  },

  // Simple local mock auth state for testing admin view
  getAdminAuthStatus(): boolean {
    if (isSupabaseConfigured && supabase) {
      return true
    }
    return localStorage.getItem(STORAGE_KEY_AUTH) === 'true'
  },

  setAdminAuthStatus(status: boolean): void {
    if (status) {
      localStorage.setItem(STORAGE_KEY_AUTH, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH)
    }
  },
}
