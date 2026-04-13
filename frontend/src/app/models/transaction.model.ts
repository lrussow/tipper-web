export interface Transaction {
	id: string;
	created_at: string;
	total_cents: number;
	provider_fee_cents: number;
	tipper_fee_cents: number;
	net_cents: number;
	currency: string;
}

export interface TransactionPage {
	items: Transaction[];
	total: number;
}
