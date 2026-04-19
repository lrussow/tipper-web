import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { LoggingService } from '../../services/logging.service';
import { LoginViewModel } from '../../viewmodels/login.view-model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  vm: LoginViewModel;

  constructor(
    private auth: AuthService,
    private logging: LoggingService,
    private router: Router,
  ) {
    this.vm = new LoginViewModel(auth, logging, router);
  }

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    await this.vm.init();
  }
}
