import { Component, OnInit } from '@angular/core';
import { LoggingService } from '../../services/logging.service';
import { PrivacyPolicyViewModel } from '../../viewmodels/privacy-policy.view-model';

@Component({
	selector: 'app-privacy-policy',
	standalone: true,
	imports: [],
	templateUrl: './privacy-policy.html',
	styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy implements OnInit {
	vm: PrivacyPolicyViewModel;

	constructor(private readonly logger: LoggingService) {
		this.vm = new PrivacyPolicyViewModel(logger);
	}

	async ngOnInit(): Promise<void> {
		await this.vm.init();
	}
}
