export class ConfirmViewModel {
	readonly headline = 'Thank You for Signing Up with The Tipper! 🎉';
	readonly subheadline = 'Welcome aboard! Your account is on its way.';
	readonly steps: { icon: string; title: string; desc: string }[] = [
		{
			icon: '📱',
			title: 'Download the App',
			desc: 'Get The Tipper on iOS or Android and sign in with your new account.',
		},
		{
			icon: '💳',
			title: 'Connect Your Bank',
			desc: 'Link a bank account via Stripe so tips go straight to you.',
		},
		{
			icon: '✅',
			title: 'Start Accepting Tips',
			desc: "Show customers the app — they tap their card or phone and you're done.",
		},
	];
	readonly downloadUrl = '/download';
}
