import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { SupabaseService } from '../services/supabase.service';
import { CustomerProfile } from '../models/customer-profile.model';
import { AddressForm } from '../models/address-form.model';
import { TransactionPage } from '../models/transaction.model';
import { environment } from '../../environments/environment';

export type AccountTab = 'profile' | 'address' | 'stripe' | 'transactions';
export type SignInMode = 'password' | 'forgot';

export class AccountViewModel {
	session: Session | null = null;
	isRecoveryMode = false;
	activeTab: AccountTab = 'profile';

	// Auth state
	signInMode: SignInMode = 'password';
	loginEmail = '';
	loginPassword = '';
	authError = '';
	authSuccess = '';
	authLoading = false;

	// Profile tab
	profile: CustomerProfile | null = null;
	profileLoading = false;
	newPassword = '';
	confirmPassword = '';
	passwordError = '';
	passwordSuccess = '';
	passwordLoading = false;

	// Address tab
	addressForm: AddressForm = {
		line1: '',
		line2: '',
		city: '',
		postal_code: '',
		country_iso2: '',
		subdivision_code: '',
	};
	addressError = '';
	addressSuccess = '';
	addressLoading = false;

	// Stripe tab
	stripeLoading = false;
	stripeError = '';

	// Transactions tab
	transactionDataSource: DataSource | null = null;
	transactionPageSize = 20;
	txFromDate: Date | null = null;
	txToDate: Date | null = null;
	transactionError = '';

	constructor(
		private supabase: SupabaseService,
		private http: HttpClient,
	) {}

	async init(): Promise<void> {
		this.session = await this.supabase.getSession();

		// Detect recovery (password reset) or OAuth hash fragment
		const hash = window.location.hash;
		if (hash.includes('type=recovery')) {
			this.isRecoveryMode = true;
			return;
		}

		if (this.session) {
			await this.loadProfile();
		}

		// Listen for auth state changes (e.g., OAuth redirect)
		this.supabase.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
			this.session = session;
			if (event === 'PASSWORD_RECOVERY') {
				this.isRecoveryMode = true;
			} else if (event === 'SIGNED_IN' && session) {
				this.isRecoveryMode = false;
				await this.loadProfile();
			} else if (event === 'SIGNED_OUT') {
				this.profile = null;
				this.transactionDataSource = null;
				this.isRecoveryMode = false;
			}
		});
	}

	// ---- Auth ----

	async signInWithOAuth(provider: 'google' | 'apple' | 'facebook' | 'twitter'): Promise<void> {
		this.authError = '';
		this.authLoading = true;
		try {
			await this.supabase.signInWithOAuth(provider as Parameters<SupabaseService['signInWithOAuth']>[0]);
		} finally {
			this.authLoading = false;
		}
	}

	async signInWithPassword(): Promise<void> {
		if (!this.loginEmail || !this.loginPassword) return;
		this.authError = '';
		this.authLoading = true;
		try {
			const err = await this.supabase.signInWithPassword(this.loginEmail, this.loginPassword);
			if (err) this.authError = err;
		} finally {
			this.authLoading = false;
		}
	}

	async sendForgotPassword(): Promise<void> {
		if (!this.loginEmail) {
			this.authError = 'Please enter your email address.';
			return;
		}
		this.authError = '';
		this.authLoading = true;
		try {
			const err = await this.supabase.resetPasswordForEmail(this.loginEmail);
			if (err) {
				this.authError = err;
			} else {
				this.authSuccess = 'Password reset email sent. Check your inbox.';
				this.signInMode = 'password';
			}
		} finally {
			this.authLoading = false;
		}
	}

	async signOut(): Promise<void> {
		await this.supabase.signOut();
		this.profile = null;
		this.session = null;
	}

	// ---- Password Change ----

	async changePassword(): Promise<void> {
		this.passwordError = '';
		this.passwordSuccess = '';
		if (!this.newPassword || this.newPassword !== this.confirmPassword) {
			this.passwordError = 'Passwords do not match.';
			return;
		}
		if (this.newPassword.length < 8) {
			this.passwordError = 'Password must be at least 8 characters.';
			return;
		}
		this.passwordLoading = true;
		try {
			const err = await this.supabase.updatePassword(this.newPassword);
			if (err) {
				this.passwordError = err;
			} else {
				this.passwordSuccess = 'Password updated successfully.';
				this.newPassword = '';
				this.confirmPassword = '';
				this.isRecoveryMode = false;
			}
		} finally {
			this.passwordLoading = false;
		}
	}

	// ---- Profile ----

	private async loadProfile(): Promise<void> {
		this.profileLoading = true;
		try {
			const me = await firstValueFrom(
				this.http.get<{ customer_id: string }>(`${environment.tipperApiBase}/account/me`, {
					headers: this.authHeaders(),
				})
			);
			const profile = await firstValueFrom(
				this.http.get<CustomerProfile>(
					`${environment.tipperApiBase}/account/profile?customer_id=${me.customer_id}`,
					{ headers: this.authHeaders() }
				)
			);
			this.profile = profile;
			if (profile.address) {
				this.addressForm = {
					line1: profile.address.line1 ?? '',
					line2: profile.address.line2 ?? '',
					city: profile.address.city ?? '',
					postal_code: profile.address.postal_code ?? '',
					country_iso2: profile.address.country_iso2 ?? '',
					subdivision_code: profile.address.subdivision_code ?? '',
				};
			}
			this.buildTransactionDataSource();
		} catch {
			// profile load failure is non-fatal; user can still see sign-out etc.
		} finally {
			this.profileLoading = false;
		}
	}

	// ---- Address ----

	async saveAddress(): Promise<void> {
		if (!this.profile) return;
		this.addressError = '';
		this.addressSuccess = '';
		this.addressLoading = true;
		try {
			await firstValueFrom(
				this.http.patch(
					`${environment.tipperApiBase}/account/address`,
					{ customer_id: this.profile.customer_id, ...this.addressForm },
					{ headers: this.authHeaders() }
				)
			);
			this.addressSuccess = 'Address saved successfully.';
			await this.loadProfile();
		} catch (e: unknown) {
			this.addressError = this.extractError(e, 'Failed to save address.');
		} finally {
			this.addressLoading = false;
		}
	}

	// ---- Stripe ----

	async openStripeOnboarding(): Promise<void> {
		if (!this.profile) return;
		this.stripeError = '';
		this.stripeLoading = true;
		try {
			const resp = await firstValueFrom(
				this.http.get<{ url: string }>(
					`${environment.tipperApiBase}/stripe/express/account_link?customer_id=${this.profile.customer_id}`,
					{ headers: this.authHeaders() }
				)
			);
			window.open(resp.url, '_blank');
		} catch (e: unknown) {
			this.stripeError = this.extractError(e, 'Could not load Stripe link. Please try again.');
		} finally {
			this.stripeLoading = false;
		}
	}

	// ---- Transactions ----

	private buildTransactionDataSource(): void {
		if (!this.profile) return;
		const customerId = this.profile.customer_id;
		const store = new CustomStore({
			key: 'id',
			load: async (loadOptions) => {
				this.transactionError = '';
				const take = loadOptions.take ?? this.transactionPageSize;
				const skip = loadOptions.skip ?? 0;
				const page = Math.floor(skip / take) + 1;
				try {
					let url = `${environment.tipperApiBase}/account/transactions?customer_id=${customerId}&page=${page}&page_size=${take}`;
					if (this.txFromDate) url += `&from_date=${this.txFromDate.toISOString().split('T')[0]}`;
					if (this.txToDate) url += `&to_date=${this.txToDate.toISOString().split('T')[0]}`;
					const resp = await firstValueFrom(
						this.http.get<TransactionPage>(url, { headers: this.authHeaders() })
					);
					return { data: resp.items, totalCount: resp.total };
				} catch (e: unknown) {
					this.transactionError = this.extractError(e, 'Failed to load transactions.');
					return { data: [], totalCount: 0 };
				}
			},
		});
		this.transactionDataSource = new DataSource({ store, pageSize: this.transactionPageSize });
	}

	reloadTransactions(): void {
		if (this.transactionDataSource) {
			this.transactionDataSource.reload();
		} else {
			this.buildTransactionDataSource();
		}
	}

	formatCents(cents: number, currency: string): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency.toUpperCase(),
		}).format(cents / 100);
	}

	// ---- Helpers ----

	private authHeaders(): HttpHeaders {
		const token = this.supabase.getAccessToken();
		return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
	}

	private extractError(e: unknown, fallback: string): string {
		if (e && typeof e === 'object' && 'error' in e) {
			const err = (e as { error: unknown }).error;
			if (err && typeof err === 'object' && 'detail' in err) {
				return String((err as { detail: unknown }).detail);
			}
		}
		return fallback;
	}
}
