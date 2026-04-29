import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DownloadViewModel } from '../../viewmodels/download.view-model';
import { LoggingService } from '../../services/logging.service';

@Component({
	selector: 'app-download',
	standalone: true,
	imports: [RouterLink, CommonModule],
	templateUrl: './download.html',
	styleUrls: ['./download.scss'],
})
export class Download implements OnInit {
	vm: DownloadViewModel;

	constructor(private logger: LoggingService) {
		this.vm = new DownloadViewModel(this.logger);
	}

	async ngOnInit(): Promise<void> {
		await this.vm.init();
	}
}
