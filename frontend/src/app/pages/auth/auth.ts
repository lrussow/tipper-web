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
    this.vm.showOpenAppButton = true;
    this.vm.deepLink = `thetipper://auth${hash}`;
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

  openApp() 
  {  
    window.location.href = this.vm.deepLink;
  }
}
