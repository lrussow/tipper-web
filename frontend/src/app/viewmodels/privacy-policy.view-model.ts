import { LoggingService } from '../services/logging.service';

export class PrivacyPolicyViewModel {
	readonly lastUpdated = 'May 28, 2026';

	private readonly log: LoggingService;

	constructor(logger: LoggingService) {
		this.log = logger.withTag('PrivacyPolicyViewModel');
	}

	async init(): Promise<void> {
		this.log.d('PrivacyPolicyViewModel initialized');
	}
}
