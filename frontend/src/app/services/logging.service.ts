import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { LogEvent } from '../models/log-event.model';

export enum LogLevel {
	VERBOSE = 0,
	DEBUG   = 1,
	INFO    = 2,
	WARN    = 3,
	ERROR   = 4,
}

const DEV_EMAILS = ['lrussow@gmail.com'];

@Injectable({ providedIn: 'root' })
export class LoggingService {
	minLevel: LogLevel = LogLevel.INFO;

	private tag: string = 'App';
	private debugModeEnabled = false;
	private root: LoggingService | null = null;

	private get effectiveMinLevel(): LogLevel {
		return this.root ? this.root.minLevel : this.minLevel;
	}

	private readonly appMeta: Record<string, string> = {
		platform: 'web',
		version: '1.0.0',
	};

	private readonly deviceMeta: Record<string, string> = {
		userAgent: navigator.userAgent,
	};

	constructor(
		private readonly http: HttpClient,
		private readonly auth: AuthService,
	) {}

	withTag(tag: string): LoggingService {
		const child = new LoggingService(this.http, this.auth);
		child.tag = tag;
		child.root = this;
		return child;
	}

	async enableDebugMode(): Promise<void> {
		if (this.debugModeEnabled) return;
		this.debugModeEnabled = true;
		this.minLevel = LogLevel.DEBUG;
		const token = this.auth.getAccessToken();
		if (!token) return;
		try {
			await fetch(`${environment.tipperApiBase}/log-level`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
				body: JSON.stringify({ level: 'DEBUG' }),
			});
		} catch { /* best-effort */ }
	}

	v(message: string, error?: unknown): void {
		this.log(LogLevel.VERBOSE, message, error);
	}

	d(message: string, error?: unknown): void {
		this.log(LogLevel.DEBUG, message, error);
	}

	i(message: string, error?: unknown): void {
		this.log(LogLevel.INFO, message, error);
	}

	w(message: string, error?: unknown): void {
		this.log(LogLevel.WARN, message, error);
	}

	e(message: string, error?: unknown): void {
		this.log(LogLevel.ERROR, message, error);
	}

	/** Call after sign-in to enable debug mode for dev users. */
	checkDevMode(email: string): void {
		if (DEV_EMAILS.includes(email.toLowerCase())) {
			this.enableDebugMode();
		}
	}

	private log(level: LogLevel, message: string, error?: unknown): void {
		if (level < this.effectiveMinLevel) return;

		const sanitized = this.sanitize(message);
		const label = `[${LogLevel[level]}] [${this.tag}]`;

		switch (level) {
			case LogLevel.VERBOSE:
			case LogLevel.DEBUG:
				console.debug(label, sanitized);
				break;
			case LogLevel.INFO:
				console.info(label, sanitized);
				break;
			case LogLevel.WARN:
				console.warn(label, sanitized, error ?? '');
				break;
			case LogLevel.ERROR:
				console.error(label, sanitized, error ?? '');
				break;
		}

		this.postAsync(LogLevel[level], sanitized, level === LogLevel.ERROR ? error : undefined);
	}

	private serializeError(error: unknown): string {
		if (error instanceof Error) {
			return error.stack ?? `${error.name}: ${error.message}`;
		}
		if (error !== null && typeof error === 'object') {
			try {
				return JSON.stringify(error);
			} catch {
				return Object.prototype.toString.call(error);
			}
		}
		return String(error);
	}

	private postAsync(level: string, message: string, error?: unknown): void {
		const payload: LogEvent = {
			timestamp: new Date().toISOString(),
			level,
			tag: this.tag,
			message,
			throwable: error !== undefined ? this.sanitize(this.serializeError(error)) : undefined,
			app: this.appMeta,
			device: this.deviceMeta,
			context: {},
		};
		// Fire-and-forget — do not await
		this.http.post(`${environment.tipperApiBase}/logs`, payload, {
			headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
		}).subscribe({ error: () => { /* best-effort */ } });
	}

	private sanitize(s: string): string {
		return s
			.replace(/Authorization=\[[^\]]*\]/gi, 'Authorization=[REDACTED]')
			.replace(/apikey=\[[^\]]*\]/gi, 'apikey=[REDACTED]')
			.replace(/Bearer\s+\S+/gi, 'Bearer REDACTED')
			.replace(/(?i:password)[=:\s]+\S+/gi, 'password=REDACTED');
	}
}
