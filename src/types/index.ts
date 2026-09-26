export type TransactionType = 'BORROW' | 'PAYMENT'

export type DebtorStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'SETTLED'

export interface Attachment {
  id: string
  transaction_id: string
  file_url: string
  file_type: string
  file_name?: string
  created_at: string
}

export interface Transaction {
  id: string
  debtor_id: string
  type: TransactionType
  amount: number
  description: string
  transaction_date: string
  created_at: string
  attachments?: Attachment[]
}

export interface Debtor {
  id: string
  user_id?: string
  name: string
  phone?: string
  secret_token: string
  created_at: string
  updated_at: string
  // Computed fields (saat di-load di UI)
  total_borrowed?: number
  total_paid?: number
  remaining_balance?: number
  status?: DebtorStatus
  transactions?: Transaction[]
}

export interface PortalData {
  debtor: {
    id: string
    name: string
    phone?: string
    created_at: string
  }
  transactions: Transaction[]
  summary: {
    total_borrowed: number
    total_paid: number
    remaining_balance: number
    is_settled: boolean
  }
}

export interface WatermarkData {
  dateTimeStr: string
  locationStr: string
  debtorName: string
  amountStr: string
}
