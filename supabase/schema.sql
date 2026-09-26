-- ==============================================================================
-- UTANGMU DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > New Query > Run
-- ==============================================================================

-- 1. Tabel Debtor (Teman)
CREATE TABLE IF NOT EXISTS public.debtors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    secret_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index token untuk akses cepat portal teman
CREATE INDEX IF NOT EXISTS idx_debtors_secret_token ON public.debtors(secret_token);
CREATE INDEX IF NOT EXISTS idx_debtors_user_id ON public.debtors(user_id);

-- 2. Tabel Transaksi (Pinjaman & Pembayaran)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debtor_id UUID REFERENCES public.debtors(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BORROW', 'PAYMENT')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_debtor_id ON public.transactions(debtor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- 3. Tabel Lampiran Bukti (Foto WebP & Video)
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'image/webp',
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_transaction_id ON public.attachments(transaction_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy Admin: Hanya user yang login (admin) yang bisa CRUD data miliknya
CREATE POLICY "Admin debtors policy" ON public.debtors
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin transactions policy" ON public.transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.debtors
            WHERE debtors.id = transactions.debtor_id
            AND debtors.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.debtors
            WHERE debtors.id = transactions.debtor_id
            AND debtors.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin attachments policy" ON public.attachments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            JOIN public.debtors ON debtors.id = transactions.debtor_id
            WHERE transactions.id = attachments.transaction_id
            AND debtors.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions
            JOIN public.debtors ON debtors.id = transactions.debtor_id
            WHERE transactions.id = attachments.transaction_id
            AND debtors.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- FUNGSI RPC PORTAL TEMAN (READ-ONLY VIA SECRET TOKEN)
-- Teman hanya bisa membaca riwayat miliknya sendiri melalui secret_token
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_portal_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debtor RECORD;
    v_transactions JSONB;
BEGIN
    -- 1. Ambil debtor berdasarkan token
    SELECT id, name, phone, created_at INTO v_debtor
    FROM public.debtors
    WHERE secret_token = p_token;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Ambil transaksi dan attachment miliknya
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'type', t.type,
            'amount', t.amount,
            'description', t.description,
            'transaction_date', t.transaction_date,
            'created_at', t.created_at,
            'attachments', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', a.id,
                        'file_url', a.file_url,
                        'file_type', a.file_type,
                        'file_name', a.file_name
                    )
                ), '[]'::jsonb)
                FROM public.attachments a
                WHERE a.transaction_id = t.id
            )
        ) ORDER BY t.transaction_date DESC, t.created_at DESC
    ), '[]'::jsonb) INTO v_transactions
    FROM public.transactions t
    WHERE t.debtor_id = v_debtor.id;

    RETURN jsonb_build_object(
        'debtor', jsonb_build_object(
            'id', v_debtor.id,
            'name', v_debtor.name,
            'phone', v_debtor.phone,
            'created_at', v_debtor.created_at
        ),
        'transactions', v_transactions
    );
END;
$$;

-- Berikan izin eksekusi get_portal_data ke public/anon
GRANT EXECUTE ON FUNCTION public.get_portal_data(TEXT) TO anon, authenticated;
