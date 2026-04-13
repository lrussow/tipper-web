import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
	DxTabPanelModule,
	DxButtonModule,
	DxTextBoxModule,
	DxDateBoxModule,
	DxDataGridModule,
	DxLoadIndicatorModule,
} from 'devextreme-angular';
import { SupabaseService } from '../../services/supabase.service';
import { AccountViewModel } from '../../viewmodels/account.view-model';

@Component({
	selector: 'app-account',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		DxTabPanelModule,
		DxButtonModule,
		DxTextBoxModule,
		DxDateBoxModule,
		DxDataGridModule,
		DxLoadIndicatorModule,
	],
	templateUrl: './account.html',
	styleUrl: './account.scss',
})
export class Account implements OnInit {
	vm: AccountViewModel;

	constructor(
		private supabase: SupabaseService,
		private http: HttpClient,
	) {
		this.vm = new AccountViewModel(supabase, http);
	}

	async ngOnInit(): Promise<void> {
		await this.vm.init();
	}
}
