import { Component, OnInit } from '@angular/core';
import { LoggingService } from '../../services/logging.service';
import { DownloadViewModel } from '../../viewmodels/download.view-model';

@Component({
	selector: 'app-download',
	standalone: true,
	imports: [],
	templateUrl: './download.html',
	styleUrl: './download.scss',
})
export class Download implements OnInit {
	vm: DownloadViewModel;

	constructor(private readonly logger: LoggingService) {
		this.vm = new DownloadViewModel(logger);
	}

	async ngOnInit(): Promise<void> {
		await this.vm.init();
	}
}
