import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [RouterLink, RouterLinkActive],
	templateUrl: './navbar.html',
	styleUrl: './navbar.scss',
})
export class Navbar {
	menuOpen = false;

	constructor(router: Router) {
		router.events.subscribe(() => {
			this.menuOpen = false;
		});
	}

	toggleMenu(): void {
		this.menuOpen = !this.menuOpen;
	}
}
