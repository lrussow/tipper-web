import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ContactViewModel } from '../../viewmodels/contact.view-model';

@Component({
selector: 'app-contact',
standalone: true,
imports: [FormsModule, CommonModule],
templateUrl: './contact.html',
})
export class Contact implements OnInit {
vm: ContactViewModel;

constructor(private http: HttpClient) {
this.vm = new ContactViewModel(http);
}

async ngOnInit(): Promise<void> {
await this.vm.init();
}
}
