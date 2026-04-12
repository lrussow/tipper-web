import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ContactForm } from '../models/contact-form.model';
import { ContactResponse } from '../models/contact-response.model';

export class ContactViewModel {
	form: ContactForm = { name: '', email: '', message: '' };
	submitted = false;
	submitting = false;
	error = '';

	constructor(private http: HttpClient) {}

	async init(): Promise<void> {
		// no async init needed
	}

	async onSubmit(): Promise<void> {
		if (!this.form.name || !this.form.email || !this.form.message) {
			return;
		}
		this.submitting = true;
		this.error = '';
		try {
			await firstValueFrom(
				this.http.post<ContactResponse>('/api/contact', this.form)
			);
			this.submitted = true;
		} catch {
			this.error = 'Something went wrong. Please try again or email us directly.';
		} finally {
			this.submitting = false;
		}
	}
}
