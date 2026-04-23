import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IpCheckService } from './services/ip-check.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('VitaminAppFront');
  private ipCheckService = inject(IpCheckService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.authService.girisSepeti()) {
      this.ipCheckService.start();
    }
  }
}
