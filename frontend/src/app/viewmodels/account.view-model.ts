import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthSession } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';
import { CustomerProfile } from '../models/customer-profile.model';
import { AddressForm } from '../models/address-form.model';
import { AccountContactForm } from '../models/account-contact-form.model';
import { Transaction, TransactionPage } from '../models/transaction.model';
import { UpdateProfileRequest } from '../models/update-profile-request.model';
import { environment } from '../../environments/environment';

export type AccountTab = 'account' | 'change-password' | 'address' | 'contact' | 'stripe' | 'transactions';

export const TX_COLUMNS = ['created_at', 'currency', 'total_cents', 'stripe_fee_cents', 'tipper_fee_cents', 'net_cents'];

export class AccountViewModel {
session: AuthSession | null = null;
activeTab: AccountTab = 'account';
profileNotFound = false;

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

// Contact tab
contactForm: AccountContactForm = {
first_name: '',
last_name: '',
phone: '',
email: '',
};

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
txPageSize = 5;
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

  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'stripe') {
    this.selectedTabIndex = 2;
  }

  if (this.session) {
    await this.loadProfile();
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
this.logger.d(`loadProfile: /account/me response ${JSON.stringify(me)}`);
const profile = await firstValueFrom(
this.http.get<CustomerProfile>(
`${environment.tipperApiBase}/account/profile?customer_id=${me.customer_id}`,
{ headers: this.authHeaders() }
)
);
this.logger.d(`loadProfile: /account/profile response ${JSON.stringify(profile)}`);
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

// ---- Profile Save ----

async saveProfile(): Promise<void> {
if (!this.profile) return;
this.profileSaveError = '';
this.profileSaveSuccess = '';
this.profileSaveLoading = true;
try {
const body: UpdateProfileRequest = {
customer_id: this.profile.customer_id,
first_name: this.contactForm.first_name ?? undefined,
last_name: this.contactForm.last_name ?? undefined,
phone: this.contactForm.phone ?? undefined,
email: this.contactForm.email || undefined,
address_line1: this.addressForm.line1 ?? undefined,
address_line2: this.addressForm.line2 ?? undefined,
address_city: this.addressForm.city ?? undefined,
address_postal_code: this.addressForm.postal_code ?? undefined,
address_country_iso2: this.addressForm.country_iso2 ?? undefined,
address_subdivision_code: this.addressForm.subdivision_code ?? undefined,
};
await firstValueFrom(
this.http.patch(
`${environment.tipperApiBase}/account/profile`,
body,
{ headers: this.authHeaders() }
)
);
this.profileSaveSuccess = 'Profile saved successfully.';
await this.loadProfile();
} catch (e: unknown) {
this.profileSaveError = this.extractError(e, 'Failed to save profile.');
this.logger.e('saveProfile failed', e);
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
const accountPageUrl = `${window.location.origin}/account?tab=stripe`;
const params = new URLSearchParams({
  customer_id: this.profile.customer_id,
  return_url: accountPageUrl,
  refresh_url: accountPageUrl,
});
const resp = await firstValueFrom(
this.http.get<{ url: string }>(
`${environment.tipperApiBase}/stripe/express/account_link?${params.toString()}`,
{ headers: this.authHeaders() }
)
);
window.location.href = resp.url;
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
this.logger.d(`loadTransactions: response items=${resp.items.length} has_more=${resp.has_more} next_cursor=${resp.next_cursor} first=${JSON.stringify(resp.items[0] ?? null)}`);
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

// ---- Input masking (mirrors Android StripeExpressViewModel) ----

private formatPhone(input: string): string {
const digits = input.replace(/\D/g, '').slice(0, 10);
if (!digits) return '';
let result = '(' + digits.slice(0, 3);
if (digits.length > 3) result += ')' + digits.slice(3, 6);
if (digits.length > 6) result += '-' + digits.slice(6);
return result;
}

private formatPostal(input: string, iso2?: string): string {
const country = (iso2 ?? '').toUpperCase();
if (country === 'US') return input.replace(/\D/g, '').slice(0, 5);
if (country === 'CA') {
  const clean = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  return clean.length > 3 ? clean.slice(0, 3) + '-' + clean.slice(3) : clean;
}
return input;
}

onPhoneChange(value: string): void {
this.contactForm.phone = this.formatPhone(value);
}

onPostalChange(value: string): void {
this.addressForm.postal_code = this.formatPostal(value, this.addressForm.country_iso2);
}

onPhoneInput(event: Event): void {
const input = event.target as HTMLInputElement;
const cursorPos = input.selectionStart ?? 0;
const rawValue = input.value;
const digitsBeforeCursor = rawValue.slice(0, cursorPos).replace(/\D/g, '').length;
const formatted = this.formatPhone(rawValue);
this.contactForm.phone = formatted;
requestAnimationFrame(() => {
  let pos = 0;
  let digits = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (digits === digitsBeforeCursor) { pos = i; break; }
    if (/\d/.test(formatted[i])) digits++;
    pos = i + 1;
  }
  input.setSelectionRange(pos, pos);
});
}

onPostalInput(event: Event): void {
const input = event.target as HTMLInputElement;
const cursorPos = input.selectionStart ?? 0;
const rawValue = input.value;
const charsBeforeCursor = rawValue.slice(0, cursorPos).replace(/[^A-Za-z0-9]/g, '').length;
const formatted = this.formatPostal(rawValue, this.addressForm.country_iso2);
this.addressForm.postal_code = formatted;
requestAnimationFrame(() => {
  let pos = 0;
  let chars = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (chars === charsBeforeCursor) { pos = i; break; }
    if (/[A-Za-z0-9]/.test(formatted[i])) chars++;
    pos = i + 1;
  }
  input.setSelectionRange(pos, pos);
});
}
}
