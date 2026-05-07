import { Component } from '@angular/core';
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
export class Confirm {
	vm = new ConfirmViewModel();
}
