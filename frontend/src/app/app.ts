import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { AuthService } from './services/auth.service';

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

	constructor(private auth: AuthService) {}

	async ngOnInit(): Promise<void> {
		await this.auth.init();
	}
}
