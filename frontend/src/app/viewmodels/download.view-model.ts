import { LoggingService } from '../services/logging.service';

export class DownloadViewModel {
	readonly apkUrl = 'the-tipper.apk';
	readonly apkFileName = 'the-tipper.apk';

	private log: LoggingService;

	constructor(logger: LoggingService) {
		this.log = logger.withTag('DownloadViewModel');
	}

	async init(): Promise<void> {
		this.log.d('Download page initialised');
	}
}
