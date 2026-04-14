import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { AccountViewModel } from '../../viewmodels/account.view-model';

@Component({
selector: 'app-account',
standalone: true,
imports: [
CommonModule,
FormsModule,
MatTabsModule,
MatButtonModule,
MatInputModule,
MatFormFieldModule,
MatDatepickerModule,
MatNativeDateModule,
MatTableModule,
MatPaginatorModule,
MatProgressSpinnerModule,
MatIconModule,
],
templateUrl: './account.html',
styleUrl: './account.scss',
})
export class Account implements OnInit {
vm: AccountViewModel;

@ViewChild(MatPaginator) paginator?: MatPaginator;

constructor(
private auth: AuthService,
private http: HttpClient,
) {
this.vm = new AccountViewModel(auth, http);
}

async ngOnInit(): Promise<void> {
await this.vm.init();
}

onPageChange(event: PageEvent): void {
this.vm.onPageChange(event.pageIndex, event.pageSize);
}
}
