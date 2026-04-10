import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';

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
export class App {
	title = 'The Tipper';
}
