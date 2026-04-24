import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { IpCheckService } from '../../services/ip-check.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private ipCheckService = inject(IpCheckService);
  private router = inject(Router);
  private langService = inject(LangService);

  constructor() {
    this.ipCheckService.stop();
    this.authService.logout();
  }

  get t() { return this.langService.t; }

  kullaniciAdi = '';
  sifre = '';
  yukleniyor = false;
  hata: string | null = null;
  sifreGoster = false;

  girisYap(): void {
    if (!this.kullaniciAdi.trim() || !this.sifre.trim()) {
      this.hata = this.t.kullaniciAdiVeSifreGiriniz;
      return;
    }
    this.yukleniyor = true;
    this.hata = null;

    this.authService.login(this.kullaniciAdi.trim(), this.sifre).subscribe({
      next: () => {
        const kalanGun = this.authService.getLisansKalanGun();
        if (kalanGun !== null && kalanGun <= 0) {
          this.authService.logout();
          this.yukleniyor = false;
          this.hata = this.t.lisansSuresiDoldu;
          return;
        }
        this.yukleniyor = false;
        this.ipCheckService.start();
        this.router.navigate(['/anasayfa']);
      },
      error: (err: any) => {
        this.yukleniyor = false;
        if (err.status === 401) {
          this.hata = this.t.kullaniciAdiVeyaSifreHatali;
        } else if (err.error?.message) {
          this.hata = err.error.message;
        } else {
          this.hata = this.t.girisSirasindaHata;
        }
      }
    });
  }
}
