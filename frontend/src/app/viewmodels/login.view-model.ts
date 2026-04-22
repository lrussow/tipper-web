import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';

export type SignInMode = 'password' | 'forgot';

export class LoginViewModel {
  isRecoveryMode = false;

  signInMode: SignInMode = 'password';
  loginEmail = '';
  loginPassword = '';
  authError = '';
  authSuccess = '';
  authLoading = false;

  // Recovery mode (password reset via email link)
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';
  passwordLoading = false;

  constructor(
    private auth: AuthService,
    private logger: LoggingService,
    private router: Router,
  ) {
    this.logger = logger.withTag('LoginViewModel');
  }

  async init(): Promise<void> {
    if (window.location.hash.includes('type=recovery')) {
      this.isRecoveryMode = true;
      return;
    }

    if (this.auth.getSession()) {
      await this.router.navigate(['/account']);
    }
  }

  async signInWithOAuth(provider: 'google' | 'apple' | 'facebook' | 'twitter'): Promise<void> {
    this.authError = '';
    this.authLoading = true;
    try {
      await this.auth.signInWithOAuth(provider);
    } finally {
      this.authLoading = false;
    }
  }

  async signInWithPassword(): Promise<void> {
    if (!this.loginEmail || !this.loginPassword) return;
    this.authError = '';
    this.authLoading = true;
    try {
      const err = await this.auth.signInWithPassword(this.loginEmail, this.loginPassword);
      if (err) {
        this.authError = err;
      } else {
        this.logger.checkDevMode(this.loginEmail);
        await this.router.navigate(['/account']);
      }
    } finally {
      this.authLoading = false;
    }
  }

  async sendForgotPassword(): Promise<void> {
    if (!this.loginEmail) {
      this.authError = 'Please enter your email address.';
      return;
    }
    this.authError = '';
    this.authLoading = true;
    try {
      const redirectTo = `${window.location.origin}/login`;
      const err = await this.auth.resetPasswordForEmail(this.loginEmail, redirectTo);
      if (err) {
        this.authError = err;
      } else {
        this.authSuccess = 'Password reset email sent. Check your inbox.';
        this.signInMode = 'password';
      }
    } finally {
      this.authLoading = false;
    }
  }

  async changePassword(): Promise<void> {
    this.passwordError = '';
    this.passwordSuccess = '';
    if (!this.newPassword || this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters.';
      return;
    }
    this.passwordLoading = true;
    try {
      const err = await this.auth.updatePassword(this.newPassword);
      if (err) {
        this.passwordError = err;
      } else {
        this.passwordSuccess = 'Password updated successfully.';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isRecoveryMode = false;
        await this.router.navigate(['/account']);
      }
    } finally {
      this.passwordLoading = false;
    }
  }
}
