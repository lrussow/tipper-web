import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { AuthService } from './services/auth.service';
import { LoggingService } from './services/logging.service';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, Navbar],
	template: `
		<app-navbar></app-navbar>
		<main>
			<router-outlet></router-outlet>
		</main>
	`,
	styleUrl: './app.scss',
})
export class App implements OnInit {
	title = 'The Tipper';

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
