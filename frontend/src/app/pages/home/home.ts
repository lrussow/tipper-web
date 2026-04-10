import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomeViewModel } from '../../viewmodels/home.view-model';

@Component({
selector: 'app-home',
standalone: true,
imports: [RouterLink],
templateUrl: './home.html',
styleUrl: './home.scss',
})
export class Home implements OnInit {
vm: HomeViewModel;

constructor() {
this.vm = new HomeViewModel();
}

async ngOnInit(): Promise<void> {
await this.vm.init();
}
}
