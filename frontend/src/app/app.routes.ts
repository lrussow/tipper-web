import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Contact } from './pages/contact/contact';

export const routes: Routes = [
	{ path: '', component: Home },
	{ path: 'contact', component: Contact },
	{ path: 'download', loadComponent: async () => (await import('./pages/download/download')).Download },
	{ path: 'account', loadComponent: async () => (await import('./pages/account/account')).Account },
	{ path: '**', redirectTo: '' },
];
