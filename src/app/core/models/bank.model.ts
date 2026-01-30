export interface Bank {
    id: string;
    name: string;
    account_number?: string;
    account_type: 'CORRIENTE' | 'AHORRO' | 'CREDITO';
    currency: 'VES' | 'USD';
    initial_balance: number;
    current_balance: number;
    bank_entity?: string;
    notes?: string;
    active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface BankTransaction {
    id?: number;
    bank_id: string;
    transaction_date: Date;
    transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';
    amount: number;
    balance_after: number;
    reference_type?: string;
    reference_id?: string;
    payment_method?: string;
    description?: string;
    notes?: string;
    created_by?: string;
    created_at?: Date;
}

export interface BankMovementReport {
    bank_name: string;
    account_number?: string;
    currency: string;
    current_balance: number;
    total_income: number;
    total_expense: number;
    transaction_count: number;
}
