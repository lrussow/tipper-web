import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthSession } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';
import { CustomerProfile } from '../models/customer-profile.model';
import { AddressForm } from '../models/address-form.model';
import { AccountContactForm } from '../models/account-contact-form.model';
import { Transaction, TransactionPage } from '../models/transaction.model';
import { environment } from '../../environments/environment';

export type AccountTab = 'account' | 'change-password' | 'address' | 'contact' | 'stripe' | 'transactions';
export type SignInMode = 'password' | 'forgot';

export const TX_COLUMNS = ['created_at', 'currency', 'total_cents', 'stripe_fee_cents', 'tipper_fee_cents', 'net_cents'];

export class AccountViewModel {
session: AuthSession | null = null;
isRecoveryMode = false;
activeTab: AccountTab = 'account';
profileNotFound = false;

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

// Contact tab
contactForm: AccountContactForm = {
first_name: '',
last_name: '',
phone: '',
email: '',
};
contactError = '';
contactSuccess = '';
contactLoading = false;

// Unified profile save
profileSaveLoading = false;
profileSaveError = '';
profileSaveSuccess = '';

// Stripe tab
stripeLoading = false;
stripeError = '';

// Tab state
selectedTabIndex = 0;

// Transactions tab
transactions: Transaction[] = [];
txHasMore = false;
txNextCursor: string | null = null;
txCursorStack: string[] = []; // stack of cursors for navigating back
txPageSize = 20;
txFromDate: Date = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
txToDate: Date = new Date();
transactionError = '';
txLoading = false;
readonly txColumns = TX_COLUMNS;

constructor(
private auth: AuthService,
private http: HttpClient,
private logger: LoggingService,
) {
this.logger = logger.withTag('AccountViewModel');
}

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
this.profileNotFound = false;
this.transactions = [];
this.txHasMore = false;
this.txNextCursor = null;
this.txCursorStack = [];
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
if (this.profileNotFound) return;
this.profileLoading = true;
try {
const me = await firstValueFrom(
this.http.get<{ customer_id: string }>(`${environment.tipperApiBase}/account/me`, {
headers: this.authHeaders(),
})
);
this.logger.d('loadProfile: /account/me response', JSON.stringify(me));
const profile = await firstValueFrom(
this.http.get<CustomerProfile>(
`${environment.tipperApiBase}/account/profile?customer_id=${me.customer_id}`,
{ headers: this.authHeaders() }
)
);
this.logger.d('loadProfile: /account/profile response', JSON.stringify(profile));
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
this.contactForm = {
first_name: profile.first_name ?? '',
last_name: profile.last_name ?? '',
phone: profile.phone ?? '',
email: profile.email ?? '',
};
} catch (e: unknown) {
const status = (e as { status?: number })?.status;
if (status === 404) {
this.profileNotFound = true;
this.logger.d('loadProfile: no customer record found (404)');
} else {
this.logger.e('loadProfile failed', e);
}
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
this.logger.e('saveAddress failed', e);
} finally {
this.addressLoading = false;
}
}

// ---- Contact ----

async saveContact(): Promise<void> {
if (!this.profile) return;
this.contactError = '';
this.contactSuccess = '';
this.contactLoading = true;
try {
await firstValueFrom(
this.http.patch(
`${environment.tipperApiBase}/account/contact`,
{ customer_id: this.profile.customer_id, ...this.contactForm },
{ headers: this.authHeaders() }
)
);
this.contactSuccess = 'Contact info saved successfully.';
await this.loadProfile();
} catch (e: unknown) {
this.contactError = this.extractError(e, 'Failed to save contact info.');
this.logger.e('saveContact failed', e);
} finally {
this.contactLoading = false;
}
}

async saveProfile(): Promise<void> {
	this.profileSaveError = '';
	this.profileSaveSuccess = '';
	this.profileSaveLoading = true;
	try {
		await Promise.all([this.saveContact(), this.saveAddress()]);
		if (!this.contactError && !this.addressError)
			this.profileSaveSuccess = 'Profile saved successfully.';
		else
			this.profileSaveError = [this.contactError, this.addressError].filter(Boolean).join(' ');
	} finally {
		this.profileSaveLoading = false;
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
this.logger.e('openStripeOnboarding failed', e);
} finally {
this.stripeLoading = false;
}
}

// ---- Transactions ----

async loadTransactions(cursor: string | null = null, pageSize = this.txPageSize): Promise<void> {
if (!this.profile) return;
this.transactionError = '';
this.txLoading = true;
this.txPageSize = pageSize;
try {
let url = `${environment.tipperApiBase}/account/transactions?customer_id=${this.profile.customer_id}&limit=${pageSize}`;
if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
if (this.txFromDate) url += `&from_date=${this.txFromDate.toISOString().split('T')[0]}`;
if (this.txToDate) url += `&to_date=${this.txToDate.toISOString().split('T')[0]}`;
const resp = await firstValueFrom(
this.http.get<TransactionPage>(url, { headers: this.authHeaders() })
);
this.logger.d('loadTransactions: response', `items=${resp.items.length} has_more=${resp.has_more} next_cursor=${resp.next_cursor} first=${JSON.stringify(resp.items[0] ?? null)}`);
this.transactions = resp.items;
this.txHasMore = resp.has_more;
this.txNextCursor = resp.next_cursor ?? null;
} catch (e: unknown) {
this.transactionError = this.extractError(e, 'Failed to load transactions.');
this.logger.e('loadTransactions failed', e);
} finally {
this.txLoading = false;
}
}

loadNextPage(): void {
if (!this.txNextCursor) return;
this.txCursorStack.push(this.txNextCursor);
this.loadTransactions(this.txNextCursor, this.txPageSize);
}

loadPrevPage(): void {
this.txCursorStack.pop(); // remove current page cursor
const cursor = this.txCursorStack.length > 0 ? this.txCursorStack[this.txCursorStack.length - 1] : null;
this.loadTransactions(cursor, this.txPageSize);
}

onDateFilterChange(): void {
this.txCursorStack = [];
this.loadTransactions(null, this.txPageSize);
}

refreshTransactions(): void {
this.txCursorStack = [];
this.loadTransactions(null, this.txPageSize);
}

// Tab indices: 0=Profile, 1=Transactions, 2=Stripe, 3=Change Password
async onTabChange(index: number): Promise<void> {
this.selectedTabIndex = index;
switch (index) {
	case 0:
		await this.loadProfile();
		break;
	case 1:
		this.txCursorStack = [];
		await this.loadTransactions(null, this.txPageSize);
		break;
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
