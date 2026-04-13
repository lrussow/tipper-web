import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, AuthChangeEvent, Provider } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
	private client: SupabaseClient;
	private currentSession: Session | null = null;

	constructor() {
		this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
		// Track current session for synchronous token access
		this.client.auth.onAuthStateChange((_event, session) => {
			this.currentSession = session;
		});
	}

	async getSession(): Promise<Session | null> {
		const { data } = await this.client.auth.getSession();
		this.currentSession = data.session;
		return data.session;
	}

	onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
		return this.client.auth.onAuthStateChange(callback);
	}

	async signInWithOAuth(provider: Provider): Promise<void> {
		await this.client.auth.signInWithOAuth({
			provider,
			options: { redirectTo: `${window.location.origin}/account` },
		});
	}

	async signInWithPassword(email: string, password: string): Promise<string | null> {
		const { error } = await this.client.auth.signInWithPassword({ email, password });
		return error?.message ?? null;
	}

	async signOut(): Promise<void> {
		await this.client.auth.signOut();
		this.currentSession = null;
	}

	async updatePassword(newPassword: string): Promise<string | null> {
		const { error } = await this.client.auth.updateUser({ password: newPassword });
		return error?.message ?? null;
	}

	async resetPasswordForEmail(email: string): Promise<string | null> {
		const { error } = await this.client.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/account`,
		});
		return error?.message ?? null;
	}

	getAccessToken(): string | null {
		return this.currentSession?.access_token ?? null;
	}
}
