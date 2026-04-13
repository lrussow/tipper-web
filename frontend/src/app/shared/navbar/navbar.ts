import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [RouterLink, RouterLinkActive, CommonModule],
	templateUrl: './navbar.html',
	styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
	menuOpen = false;
	isSignedIn = false;

	private authSub: { data: { subscription: { unsubscribe: () => void } } } | null = null;

	constructor(
		private router: Router,
		private supabase: SupabaseService,
	) {
		router.events.subscribe(() => {
			this.menuOpen = false;
		});
	}

	async ngOnInit(): Promise<void> {
		const session = await this.supabase.getSession();
		this.isSignedIn = !!session;

		this.authSub = this.supabase.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
			this.isSignedIn = !!session;
		});
	}

	ngOnDestroy(): void {
		this.authSub?.data.subscription.unsubscribe();
	}

	toggleMenu(): void {
		this.menuOpen = !this.menuOpen;
	}

	async signOut(): Promise<void> {
		await this.supabase.signOut();
		await this.router.navigate(['/account']);
	}
}

