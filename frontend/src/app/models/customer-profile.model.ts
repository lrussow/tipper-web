export interface AddressDto {
	line1: string | null;
	line2: string | null;
	city: string | null;
	postal_code: string | null;
	country_iso2: string | null;
	subdivision_code: string | null;
}

export interface CustomerProfile {
	customer_id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	stripe_onboarding_complete: boolean;
	stripe_charges_enabled: boolean;
	stripe_payouts_enabled: boolean;
	address: AddressDto | null;
}
