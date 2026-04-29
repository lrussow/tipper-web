import { LoggingService } from '../services/logging.service';

export class DownloadViewModel {
	headline = 'Download The Tipper';
	subheadline = 'Get the app for iOS or Android — contactless tipping powered by Stripe.';
	iosUrl = '#';
	playUrl = '#';

	private logger?: LoggingService;

	constructor(logger?: LoggingService) {
		this.logger = logger ? logger.withTag('DownloadViewModel') : undefined;
	}

	async init(): Promise<void> {
		// Placeholder: could fetch dynamic URLs or feature flags
	}

	trackClick(platform: string): void {
		try {
			this.logger?.i(`Download button clicked: ${platform}`);
		} catch { /* best-effort */ }
	}
}
