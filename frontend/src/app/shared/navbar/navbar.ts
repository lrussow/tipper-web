import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [RouterLink, RouterLinkActive, CommonModule],
	templateUrl: './navbar.html',
})
export class Navbar implements OnInit, OnDestroy {
	menuOpen = false;
	isSignedIn = false;

	private sessionSub?: Subscription;

	constructor(
		private router: Router,
		private auth: AuthService,
	) {
		router.events.subscribe(() => {
			this.menuOpen = false;
		});
	}

	async ngOnInit(): Promise<void> {
		this.isSignedIn = !!this.auth.getSession();
		this.sessionSub = this.auth.session$.subscribe(session => {
			this.isSignedIn = !!session;
		});
	}

	ngOnDestroy(): void {
		this.sessionSub?.unsubscribe();
	}

	toggleMenu(): void {
		this.menuOpen = !this.menuOpen;
	}

	async signOut(): Promise<void> {
		await this.auth.signOut();
		await this.router.navigate(['/account']);
	}
}

