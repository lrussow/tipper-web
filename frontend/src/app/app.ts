import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { AuthService } from './services/auth.service';
import { LoggingService } from './services/logging.service';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, RouterLink, Navbar],
	template: `
		<app-navbar></app-navbar>
		<main>
			<router-outlet></router-outlet>
		</main>
		<footer class="site-footer">
			<span>&copy; {{ year }} The Tipper™. All rights reserved.</span>
			<a id="footer-privacy-policy" routerLink="/privacy-policy">Privacy Policy</a>
		</footer>
	`,
	styles: [`
		.site-footer {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 1.5rem;
			padding: 1.25rem 2rem;
			background: #1a1a2e;
			color: rgba(255,255,255,0.55);
			font-size: 0.85rem;
		}
		.site-footer a {
			color: rgba(255,255,255,0.75);
			text-decoration: none;
			&:hover { text-decoration: underline; }
		}
		@media (max-width: 640px) {
			.site-footer { flex-direction: column; gap: 0.5rem; text-align: center; }
		}
	`],
})
export class App implements OnInit {
	title = 'The Tipper';
	readonly year = new Date().getFullYear();

	constructor(
		private readonly auth: AuthService,
		private readonly logger: LoggingService,
	) {}

	async ngOnInit(): Promise<void> {
		await this.auth.init();
		const session = this.auth.getSession();
		if (session) {
			const email = this.parseEmailFromToken(session.accessToken);
			if (email) this.logger.checkDevMode(email);
		}
		this.auth.onAuthStateChange(session => {
			if (session) {
				const email = this.parseEmailFromToken(session.accessToken);
				if (email) this.logger.checkDevMode(email);
			}
		});
	}

	private parseEmailFromToken(token: string): string | null {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return payload.email ?? null;
		} catch {
			return null;
		}
	}
}
