import { Feature } from '../models/feature.model';
import { FeatureTableRow, PricingRow, Step } from '../models/pricing-row.model';

export class HomeViewModel {
	features: Feature[] = [
		{ icon: '🎵', title: 'Street Performers & Buskers', description: 'Replace the tip jar with a tap. Your audience wants to show appreciation — make sure they can, even without cash.' },
		{ icon: '🏨', title: 'Hotel & Hospitality Staff', description: 'Bellhops, concierge, housekeeping, valet attendants — accept gratuities professionally without the awkwardness of waiting for cash.' },
		{ icon: '💇', title: 'Barbers, Stylists & Personal Services', description: 'Hairstylists, spa therapists, massage therapists, dog groomers, mobile detailers — collect tips on the spot, separate from the service payment.' },
		{ icon: '🍽️', title: 'Food Service & Delivery', description: 'Food truck operators, catering staff, delivery drivers, pop-up restaurant servers — get tipped directly, not through a third-party app.' },
		{ icon: '🚗', title: 'Rideshare & Gig Workers', description: 'Independent drivers, couriers, movers, handymen — offer customers a simple way to tip beyond whatever platform you\'re on.' },
		{ icon: '🏟️', title: 'Events & Venues', description: 'Coat check attendants, parking staff, tour guides, festival workers, DJs — accept tips from attendees who only carry a card.' },
		{ icon: '🎿', title: 'Seasonal & Tourism', description: 'Ski instructors, surf coaches, fishing guides, resort staff — tourists rarely carry local cash, but they always have a card.' },
	];

	featureTable: FeatureTableRow[] = [
		{ feature: 'No hardware required', benefit: 'Your smartphone is the terminal — no dongles, readers, or accessories' },
		{ feature: 'Tap to Pay (NFC)', benefit: 'Accepts Visa, Mastercard, American Express, Interac, Apple Pay, and Google Pay' },
		{ feature: 'Powered by Stripe', benefit: 'Industry-leading payment processing with direct bank payouts' },
		{ feature: 'Preset tip amounts', benefit: 'Configurable denominations — customers tap once, no fumbling' },
		{ feature: 'Direct to your bank', benefit: 'Stripe Express routes funds straight to your connected bank account' },
		{ feature: 'Multi-currency', benefit: 'Accept tips in the currency local to your region' },
		{ feature: 'iOS & Android', benefit: 'Works on both platforms — use whatever phone you already own' },
	];

	pricing: PricingRow[] = [
		{ item: 'Monthly subscription', details: 'Free' },
		{ item: 'Transaction fees', details: '10% per transaction + standard Stripe fees' },
		{ item: 'iOS & Android', details: 'Both platforms included' },
		{ item: 'Setup fees', details: 'None' },
		{ item: 'Hardware required', details: 'None — just your smartphone' },
	];

	steps: Step[] = [
		{ num: '1', title: 'Download', desc: 'The Tipper from the App Store or Google Play' },
		{ num: '2', title: 'Create your account', desc: 'Name, email, and bank details' },
		{ num: '3', title: 'Set your tip amounts', desc: 'Choose the denominations to display' },
		{ num: '4', title: 'Start accepting tips', desc: 'You\'re earning' },
	];

	async init(): Promise<void> {
		// reserved for future async data loading
	}
}
