import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Contact } from './pages/contact/contact';
import { Account } from './pages/account/account';

export const routes: Routes = [
	{ path: '', component: Home },
	{ path: 'contact', component: Contact },
	{ path: 'account', component: Account },
	{ path: '**', redirectTo: '' },
];
