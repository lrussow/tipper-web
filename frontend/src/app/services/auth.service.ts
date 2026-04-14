import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthSession {
	accessToken: string;
	expiresAt: number; // Unix seconds
}

interface AuthTokenResponse {
	access_token: string;
	expires_in: number;
	token_type: string;
}

type BroadcastMessage =
	| { type: 'session'; accessToken: string; expiresAt: number }
	| { type: 'signout' };

@Injectable({ providedIn: 'root' })
export class AuthService {
	private accessToken: string | null = null;
	private expiresAt = 0;
	private refreshTimer?: ReturnType<typeof setTimeout>;
	private channel = new BroadcastChannel('tipper_auth');

	private sessionSubject = new BehaviorSubject<AuthSession | null>(null);
	readonly session$ = this.sessionSubject.asObservable();

	constructor(private http: HttpClient) {
		this.channel.onmessage = (e: MessageEvent<BroadcastMessage>) => this.onCrossTabMessage(e.data);
	}

	/** Call once on app startup — restores session from cookie or OAuth/recovery hash. */
	async init(): Promise<void> {
		const hashSession = this.parseHashTokens();
		if (hashSession) {
			this.applySession(hashSession.accessToken, hashSession.expiresAt);
			this.broadcastSession();
			// Exchange the hash access token for a proper HttpOnly refresh cookie
			try {
				await this.refresh();
			} catch {
				// non-fatal — hash token is still usable until expiry
			}
			return;
		}
		// Attempt silent restore via HttpOnly refresh cookie
		try {
			await this.refresh();
		} catch {
			// No cookie or cookie expired — user is logged out
		}
	}

	getSession(): AuthSession | null {
		return this.sessionSubject.value;
	}

	getAccessToken(): string | null {
		return this.accessToken;
	}

	onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
		const sub = this.session$.subscribe(callback);
		return () => sub.unsubscribe();
	}

	async signInWithPassword(email: string, password: string): Promise<string | null> {
		try {
			const data = await firstValueFrom(
				this.http.post<AuthTokenResponse>(`${environment.tipperApiBase}/auth/login`, { email, password })
			);
			this.applyTokenResponse(data);
			this.broadcastSession();
			return null;
		} catch (e: unknown) {
			return this.extractError(e, 'Sign in failed.');
		}
	}

	async signInWithOAuth(provider: 'google' | 'apple' | 'facebook' | 'twitter'): Promise<void> {
		const redirectTo = `${window.location.origin}/account`;
		const data = await firstValueFrom(
			this.http.get<{ url: string }>(
				`${environment.tipperApiBase}/auth/oauth/${provider}?redirect_to=${encodeURIComponent(redirectTo)}`
			)
		);
		window.location.href = data.url;
	}

	async signOut(): Promise<void> {
		try {
			await firstValueFrom(
				this.http.post(`${environment.tipperApiBase}/auth/logout`, {}, {
					headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
				})
			);
		} catch {
			// best-effort
		} finally {
			this.clearSession();
			this.channel.postMessage({ type: 'signout' } satisfies BroadcastMessage);
		}
	}

	async resetPasswordForEmail(email: string, redirectTo?: string): Promise<string | null> {
		try {
			await firstValueFrom(
				this.http.post(`${environment.tipperApiBase}/auth/forgot-password`, {
					email,
					redirect_to: redirectTo ?? `${window.location.origin}/account`,
				})
			);
			return null;
		} catch (e: unknown) {
			return this.extractError(e, 'Could not send reset email.');
		}
	}

	async updatePassword(newPassword: string): Promise<string | null> {
		try {
			await firstValueFrom(
				this.http.patch(`${environment.tipperApiBase}/auth/update-password`, { password: newPassword }, {
					headers: { Authorization: `Bearer ${this.accessToken}` },
				})
			);
			return null;
		} catch (e: unknown) {
			return this.extractError(e, 'Could not update password.');
		}
	}

	async refresh(): Promise<void> {
		const data = await firstValueFrom(
			this.http.post<AuthTokenResponse>(`${environment.tipperApiBase}/auth/refresh`, {}, { withCredentials: true })
		);
		this.applyTokenResponse(data);
	}

	private applyTokenResponse(data: AuthTokenResponse): void {
		const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
		this.applySession(data.access_token, expiresAt);
	}

	private applySession(accessToken: string, expiresAt: number): void {
		this.accessToken = accessToken;
		this.expiresAt = expiresAt;
		this.sessionSubject.next({ accessToken, expiresAt });
		this.scheduleRefresh();
	}

	private clearSession(): void {
		this.accessToken = null;
		this.expiresAt = 0;
		clearTimeout(this.refreshTimer);
		this.sessionSubject.next(null);
	}

	private scheduleRefresh(): void {
		clearTimeout(this.refreshTimer);
		const msUntilRefresh = (this.expiresAt * 1000) - Date.now() - 60_000;
		if (msUntilRefresh <= 0) {
			// Already near/past expiry — refresh immediately
			this.refresh().catch(() => this.clearSession());
			return;
		}
		this.refreshTimer = setTimeout(() => {
			this.refresh().catch(() => this.clearSession());
		}, msUntilRefresh);
	}

	private broadcastSession(): void {
		if (this.accessToken) {
			this.channel.postMessage({
				type: 'session',
				accessToken: this.accessToken,
				expiresAt: this.expiresAt,
			} satisfies BroadcastMessage);
		}
	}

	private onCrossTabMessage(msg: BroadcastMessage): void {
		if (msg.type === 'session') {
			this.applySession(msg.accessToken, msg.expiresAt);
		} else if (msg.type === 'signout') {
			this.clearSession();
		}
	}

	/** Parse access_token and expiry from URL hash fragment (OAuth/recovery callback). */
	private parseHashTokens(): { accessToken: string; expiresAt: number } | null {
		const hash = window.location.hash;
		if (!hash) return null;
		const params = new URLSearchParams(hash.slice(1));
		const accessToken = params.get('access_token');
		const expiresIn = params.get('expires_in');
		if (!accessToken) return null;
		// Clear the hash so tokens don't linger in browser history
		history.replaceState(null, '', window.location.pathname + window.location.search);
		const expiresAt = Math.floor(Date.now() / 1000) + (expiresIn ? parseInt(expiresIn, 10) : 3600);
		return { accessToken, expiresAt };
	}

	private extractError(e: unknown, fallback: string): string {
		if (e && typeof e === 'object' && 'error' in e) {
			const err = (e as { error: unknown }).error;
			if (err && typeof err === 'object' && 'detail' in err) return String((err as { detail: unknown }).detail);
		}
		return fallback;
	}
}
