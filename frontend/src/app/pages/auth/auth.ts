import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthViewModel } from '../../viewmodels/auth.view-model';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
})
export class Auth implements OnInit {
  vm = new AuthViewModel();

  ngOnInit(): void {
    this.handleAuth();
  }

  private parseHash(hash: string) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      type: params.get('type'),
    };
  }

  private isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  private redirectToApp(hash: string) {
    const deepLink = `thetipper://auth${hash}`;

    // hide UI to avoid flicker
    document.body.style.display = 'none';

    // Try to open app
    window.location.href = deepLink;

    // Fallback — show page if app didn't open
    setTimeout(() => {
      document.body.style.display = '';
    }, 1200);
  }

  private handleAuth() {
    const hash = window.location.hash;

    if (!hash) return;

    const { access_token, type } = this.parseHash(hash);

    console.log('Auth type:', type);
    console.log('Access token exists:', !!access_token);

    if (this.isMobile()) {
      this.redirectToApp(hash);
    }
  }
}
