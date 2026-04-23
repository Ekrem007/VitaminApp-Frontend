import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { AdminService, AdminUser, UpdateUserRequest, CreateUserRequest } from '../../services/admin.service';
import { LangService } from '../../services/lang.service';

@Component({
  selector: 'app-admin-panel',
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanelComponent implements OnInit {
  kullanicilar: AdminUser[] = [];
  yukleniyor = true;
  hata: string | null = null;

  // Dropdown
  acikDropdownId: string | null = null;

  // Lisans modal
  lisansModalGoster = false;
  lisansSeciliKullanici: AdminUser | null = null;
  lisansBitisInput = '';
  lisansYukleniyor = false;
  lisansHata: string | null = null;
  lisansBasari: string | null = null;

  // Silme modal
  silModalGoster = false;
  silSeciliKullanici: AdminUser | null = null;
  silYukleniyor = false;
  silHata: string | null = null;

  // Kullanıcı oluşturma modal
  olusturModalGoster = false;
  olusturForm = { name: '', userName: '', password: '', phoneNumber: '', sirketAdi: '' };
  olusturSifreGoster = false;
  olusturYukleniyor = false;
  olusturHata: string | null = null;
  olusturBasari: string | null = null;

  // Güncelle modal
  guncelleModalGoster = false;
  guncelleSeciliKullanici: AdminUser | null = null;
  guncelleForm = { name: '', userName: '', phoneNumber: '', sirketAdi: '' };
  guncelleYukleniyor = false;
  guncelleHata: string | null = null;
  guncelleBasari: string | null = null;

  // Şifre sıfırlama modal
  sifreModalGoster = false;
  sifreSeciliKullanici: AdminUser | null = null;
  yeniSifre = '';
  sifreGoster = false;
  sifreYukleniyor = false;
  sifreHata: string | null = null;
  sifreBasari: string | null = null;

  constructor(private adminService: AdminService, private langService: LangService) {}

  get t() { return this.langService.t; }

  ngOnInit(): void {
    this.kullanicilariYukle();
  }

  kullanicilariYukle(): void {
    this.yukleniyor = true;
    this.hata = null;
    this.adminService.getUsers().subscribe({
      next: (res) => {
        if (res.success !== false) {
          this.kullanicilar = res.data;
        } else {
          this.hata = res.message || 'Kullanıcılar yüklenemedi.';
        }
        this.yukleniyor = false;
      },
      error: () => {
        this.hata = 'Sunucuya bağlanırken bir hata oluştu.';
        this.yukleniyor = false;
      }
    });
  }

  dropdownToggle(id: string): void {
    this.acikDropdownId = this.acikDropdownId === id ? null : id;
  }

  dropdownKapat(): void {
    this.acikDropdownId = null;
  }

  // --- Kullanıcı Oluştur ---
  olusturAc(): void {
    this.olusturForm = { name: '', userName: '', password: '', phoneNumber: '', sirketAdi: '' };
    this.olusturSifreGoster = false;
    this.olusturHata = null;
    this.olusturBasari = null;
    this.olusturModalGoster = true;
  }

  olusturKapat(): void {
    this.olusturModalGoster = false;
    this.olusturHata = null;
    this.olusturBasari = null;
  }

  olusturKaydet(): void {
    if (!this.olusturForm.name.trim() || !this.olusturForm.userName.trim() || !this.olusturForm.password.trim()) {
      this.olusturHata = 'Ad, kullanıcı adı ve şifre zorunludur.';
      return;
    }
    this.olusturYukleniyor = true;
    this.olusturHata = null;
    this.olusturBasari = null;

    const req: CreateUserRequest = {
      name: this.olusturForm.name.trim(),
      userName: this.olusturForm.userName.trim(),
      password: this.olusturForm.password,
      phoneNumber: this.olusturForm.phoneNumber.trim(),
      sirketAdi: this.olusturForm.sirketAdi.trim() || null
    };

    this.adminService.createUser(req).subscribe({
      next: (res) => {
        this.olusturYukleniyor = false;
        this.olusturBasari = res.message || 'Kullanıcı başarıyla oluşturuldu.';
        this.kullanicilariYukle();
      },
      error: (err) => {
        this.olusturYukleniyor = false;
        this.olusturHata = err?.error?.message || err?.message || 'Kullanıcı oluşturulamadı.';
      }
    });
  }

  // --- Lisans ---
  lisansAc(kullanici: AdminUser): void {
    this.acikDropdownId = null;
    this.lisansSeciliKullanici = kullanici;
    this.lisansBitisInput = kullanici.lisansBitis
      ? kullanici.lisansBitis.substring(0, 10)
      : '';
    this.lisansHata = null;
    this.lisansBasari = null;
    this.lisansModalGoster = true;
  }

  lisansKapat(): void {
    this.lisansModalGoster = false;
    this.lisansSeciliKullanici = null;
    this.lisansBitisInput = '';
    this.lisansHata = null;
    this.lisansBasari = null;
  }

  lisansKaydet(): void {
    if (!this.lisansSeciliKullanici || !this.lisansBitisInput) {
      this.lisansHata = 'Lütfen bir tarih seçin.';
      return;
    }
    this.lisansYukleniyor = true;
    this.lisansHata = null;
    this.lisansBasari = null;

    const lisansBitisIso = `${this.lisansBitisInput}T23:59:59`;

    this.adminService.setLicense({
      userId: this.lisansSeciliKullanici.id,
      lisansBitis: lisansBitisIso
    }).subscribe({
      next: (res) => {
        this.lisansYukleniyor = false;
        this.lisansBasari = res.message || 'Lisans başarıyla tanımlandı.';
        const k = this.kullanicilar.find(u => u.id === this.lisansSeciliKullanici!.id);
        if (k) k.lisansBitis = lisansBitisIso;
      },
      error: (err) => {
        this.lisansYukleniyor = false;
        this.lisansHata = err?.error?.message || err?.message || 'Lisans tanımlanamadı.';
      }
    });
  }

  // --- Silme ---
  silAc(kullanici: AdminUser): void {
    this.acikDropdownId = null;
    this.silSeciliKullanici = kullanici;
    this.silHata = null;
    this.silModalGoster = true;
  }

  silKapat(): void {
    this.silModalGoster = false;
    this.silSeciliKullanici = null;
    this.silHata = null;
  }

  silOnayla(): void {
    if (!this.silSeciliKullanici) return;
    this.silYukleniyor = true;
    this.silHata = null;
    this.adminService.deleteUser(this.silSeciliKullanici.id).subscribe({
      next: () => {
        this.kullanicilar = this.kullanicilar.filter(u => u.id !== this.silSeciliKullanici!.id);
        this.silYukleniyor = false;
        this.silKapat();
      },
      error: (err) => {
        this.silYukleniyor = false;
        this.silHata = err?.error?.message || err?.message || 'Kullanıcı silinemedi.';
      }
    });
  }

  // --- Güncelle ---
  guncelleAc(kullanici: AdminUser): void {
    this.acikDropdownId = null;
    this.guncelleSeciliKullanici = kullanici;
    this.guncelleForm = { name: kullanici.name, userName: kullanici.userName, phoneNumber: kullanici.phoneNumber || '', sirketAdi: kullanici.sirketAdi || '' };
    this.guncelleHata = null;
    this.guncelleBasari = null;
    this.guncelleModalGoster = true;
  }

  guncelleKapat(): void {
    this.guncelleModalGoster = false;
    this.guncelleSeciliKullanici = null;
    this.guncelleHata = null;
    this.guncelleBasari = null;
  }

  guncelleKaydet(): void {
    if (!this.guncelleSeciliKullanici) return;
    if (!this.guncelleForm.name.trim() || !this.guncelleForm.userName.trim()) {
      this.guncelleHata = 'Ad ve kullanıcı adı zorunludur.';
      return;
    }
    this.guncelleYukleniyor = true;
    this.guncelleHata = null;
    this.guncelleBasari = null;

    const req: UpdateUserRequest = {
      userId: this.guncelleSeciliKullanici.id,
      name: this.guncelleForm.name.trim(),
      userName: this.guncelleForm.userName.trim(),
      phoneNumber: this.guncelleForm.phoneNumber.trim(),
      sirketAdi: this.guncelleForm.sirketAdi.trim() || null
    };

    this.adminService.updateUser(req).subscribe({
      next: (res) => {
        this.guncelleYukleniyor = false;
        this.guncelleBasari = res.message || 'Kullanıcı başarıyla güncellendi.';
        const k = this.kullanicilar.find(u => u.id === this.guncelleSeciliKullanici!.id);
        if (k) { k.name = req.name; k.userName = req.userName; k.phoneNumber = req.phoneNumber; }
      },
      error: (err) => {
        this.guncelleYukleniyor = false;
        this.guncelleHata = err?.error?.message || err?.message || 'Kullanıcı güncellenemedi.';
      }
    });
  }

  // --- Şifre Sıfırlama ---
  sifreAc(kullanici: AdminUser): void {
    this.acikDropdownId = null;
    this.sifreSeciliKullanici = kullanici;
    this.yeniSifre = '';
    this.sifreGoster = false;
    this.sifreHata = null;
    this.sifreBasari = null;
    this.sifreModalGoster = true;
  }

  sifreKapat(): void {
    this.sifreModalGoster = false;
    this.sifreSeciliKullanici = null;
    this.yeniSifre = '';
    this.sifreGoster = false;
    this.sifreHata = null;
    this.sifreBasari = null;
  }

  sifreSifirla(): void {
    if (!this.sifreSeciliKullanici || !this.yeniSifre.trim()) {
      this.sifreHata = 'Lütfen yeni şifre girin.';
      return;
    }
    this.sifreYukleniyor = true;
    this.sifreHata = null;
    this.sifreBasari = null;

    this.adminService.resetPassword(this.sifreSeciliKullanici.id, this.yeniSifre).subscribe({
      next: (res) => {
        this.sifreYukleniyor = false;
        this.sifreBasari = res.message || 'Şifre başarıyla sıfırlandı.';
      },
      error: (err) => {
        this.sifreYukleniyor = false;
        this.sifreHata = err?.error?.message || err?.message || 'Şifre sıfırlanamadı.';
      }
    });
  }
}
