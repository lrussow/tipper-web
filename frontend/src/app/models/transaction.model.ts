export interface Transaction {
	id: string;
	created_at: string;
	total_cents: number;
	stripe_fee_cents: number;
	tipper_fee_cents: number;
	net_cents: number;
	currency: string;
}

export interface TransactionPage {
	items: Transaction[];
	has_more: boolean;
	next_cursor: string | null;
}
