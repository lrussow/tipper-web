import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthSession } from '../services/auth.service';
import { CustomerProfile } from '../models/customer-profile.model';
import { AddressForm } from '../models/address-form.model';
import { Transaction, TransactionPage } from '../models/transaction.model';
import { environment } from '../../environments/environment';

export type AccountTab = 'profile' | 'address' | 'stripe' | 'transactions';
export type SignInMode = 'password' | 'forgot';

export const TX_COLUMNS = ['created_at', 'currency', 'total_cents', 'provider_fee_cents', 'tipper_fee_cents', 'net_cents'];

export class AccountViewModel {
session: AuthSession | null = null;
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
transactions: Transaction[] = [];
txTotalCount = 0;
txPageIndex = 0;
txPageSize = 20;
txFromDate: Date | null = null;
txToDate: Date | null = null;
transactionError = '';
txLoading = false;
readonly txColumns = TX_COLUMNS;

constructor(
private auth: AuthService,
private http: HttpClient,
) {}

async init(): Promise<void> {
this.session = this.auth.getSession();

const hash = window.location.hash;
if (hash.includes('type=recovery')) {
this.isRecoveryMode = true;
return;
}

if (this.session) {
await this.loadProfile();
}

this.auth.onAuthStateChange(async (session: AuthSession | null) => {
const wasSignedIn = !!this.session;
this.session = session;
if (session && !wasSignedIn) {
this.isRecoveryMode = false;
await this.loadProfile();
} else if (!session && wasSignedIn) {
this.profile = null;
this.transactions = [];
this.txTotalCount = 0;
this.isRecoveryMode = false;
}
});
}

// ---- Auth ----

async signInWithOAuth(provider: 'google' | 'apple' | 'facebook' | 'twitter'): Promise<void> {
this.authError = '';
this.authLoading = true;
try {
await this.auth.signInWithOAuth(provider);
} finally {
this.authLoading = false;
}
}

async signInWithPassword(): Promise<void> {
if (!this.loginEmail || !this.loginPassword) return;
this.authError = '';
this.authLoading = true;
try {
const err = await this.auth.signInWithPassword(this.loginEmail, this.loginPassword);
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
const err = await this.auth.resetPasswordForEmail(this.loginEmail);
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
await this.auth.signOut();
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
const err = await this.auth.updatePassword(this.newPassword);
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
await this.loadTransactions(0, this.txPageSize);
} catch {
// profile load failure is non-fatal
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

async loadTransactions(pageIndex: number, pageSize: number): Promise<void> {
if (!this.profile) return;
this.transactionError = '';
this.txLoading = true;
this.txPageIndex = pageIndex;
this.txPageSize = pageSize;
try {
const page = pageIndex + 1;
let url = `${environment.tipperApiBase}/account/transactions?customer_id=${this.profile.customer_id}&page=${page}&page_size=${pageSize}`;
if (this.txFromDate) url += `&from_date=${this.txFromDate.toISOString().split('T')[0]}`;
if (this.txToDate) url += `&to_date=${this.txToDate.toISOString().split('T')[0]}`;
const resp = await firstValueFrom(
this.http.get<TransactionPage>(url, { headers: this.authHeaders() })
);
this.transactions = resp.items;
this.txTotalCount = resp.total;
} catch (e: unknown) {
this.transactionError = this.extractError(e, 'Failed to load transactions.');
} finally {
this.txLoading = false;
}
}

onPageChange(pageIndex: number, pageSize: number): void {
this.loadTransactions(pageIndex, pageSize);
}

onDateFilterChange(): void {
this.loadTransactions(0, this.txPageSize);
}

formatCents(cents: number, currency: string): string {
return new Intl.NumberFormat('en-US', {
style: 'currency',
currency: currency.toUpperCase(),
}).format(cents / 100);
}

// ---- Helpers ----

private authHeaders(): HttpHeaders {
const token = this.auth.getAccessToken();
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
