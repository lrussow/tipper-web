import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmViewModel } from '../../viewmodels/confirm.view-model';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './confirm.html',
  styleUrls: ['./confirm.scss'],
})
export class Confirm implements OnInit {
  vm = new ConfirmViewModel();

  ngOnInit(): void {
    this.handleConfirm();
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

    // Optional fallback
    setTimeout(() => {
      document.body.style.display = '';
      console.log('App not opened — fallback to web flow');
    }, 1200);
  }

  private handleConfirm() {
    const hash = window.location.hash;

    if (!hash) {
      console.error('No auth data found in URL');
      return;
    }

    const { access_token, type } = this.parseHash(hash);

    console.log('Auth type:', type);
    console.log('Access token exists:', !!access_token);

    if (this.isMobile()) {
      this.redirectToApp(hash);
      return;
    }
  }
}