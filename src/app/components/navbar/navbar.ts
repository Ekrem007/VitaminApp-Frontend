import { Component, ElementRef, ViewChild, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UrunService } from '../../services/urun.service';
import { LangService, DILLER, Dil } from '../../services/lang.service';
import { AuthService } from '../../services/auth.service';
import { Urun } from '../../Models/UrunDtos/urun.model';
import Swal from 'sweetalert2';

// ResimTipi enum (backend ile eşleşen)
export const ResimTipi = { Kapak: 1, Icerik: 2 } as const;

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('barkodInput') barkodInputRef!: ElementRef<HTMLInputElement>;

  // Dil
  diller: Dil[] = DILLER;
  aktifDil = 'tr';
  private langSub!: Subscription;

  get t() { return this.langService.t; }

  // Barkod modal
  barkodModalGoster = false;
  barkod = '';
  araniyor = false;
  hata: string | null = null;

  // Resim yükleme modal
  resimModalGoster = false;
  urunler: Urun[] = [];
  seciliUrunId: number | null = null;
  seciliTip: number = ResimTipi.Kapak;
  seciliDosya: File | null = null;
  dosyaOnizleme: string | null = null;
  resimYukleniyor = false;
  resimHata: string | null = null;
  resimBasari: string | null = null;
  // Çıkış doğrulama modal
  cikisModalGoster = false;
  cikisKullaniciAdi = '';
  cikirSifre = '';
  cikirSifreGoster = false;
  cikisYukleniyor = false;
  cikisHata: string | null = null;

  // İletişim modal
  iletisimModalGoster = false;

  readonly ResimTipi = ResimTipi;
  isAdmin = false;
  lisansKalanGun: number | null = null;
  sirketAdi = 'Vitamin\\Pharma';

  constructor(
    private urunService: UrunService,
    private router: Router,
    private langService: LangService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.lisansKalanGun = this.authService.getLisansKalanGun();
    this.langSub = this.langService.aktifDil$.subscribe(d => (this.aktifDil = d));
    this.authService.getUserCompanyName().subscribe({
      next: (ad) => {
        const trimmed = ad?.trim();
        if (trimmed && trimmed !== 'null') this.sirketAdi = trimmed;
      },
      error: () => {}
    });
    this.urunService.getAll().subscribe({
      next: (res) => (this.urunler = res.data),
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  dilSec(kod: string): void {
    this.langService.dilSec(kod);
  }

  lisansGoster(): void {
    if (this.lisansKalanGun === null) return;
    const kritik = this.lisansKalanGun <= 7;
    const uyari = this.lisansKalanGun > 7 && this.lisansKalanGun <= 30;
    const icon = kritik ? 'warning' : uyari ? 'info' : 'success';
    const mesaj = this.lisansKalanGun <= 0
      ? this.t.lisansSonaErdi
      : this.t.lisansBitisineKalanGun.replace('{n}', this.lisansKalanGun + '');
    Swal.fire({
      title: '🔑 Lisans Durumu',
      text: mesaj,
      icon,
      timer: 10000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: true,
    });
  }

  // --- Çıkış ---
  cikisAc(): void {
    this.cikisKullaniciAdi = this.authService.getKullanici() ?? '';
    this.cikirSifre = '';
    this.cikirSifreGoster = false;
    this.cikisHata = null;
    this.cikisYukleniyor = false;
    this.cikisModalGoster = true;
  }

  cikisKapat(): void {
    this.cikisModalGoster = false;
  }

  cikisOnayla(): void {
    if (!this.cikisKullaniciAdi.trim() || !this.cikirSifre.trim()) {
      this.cikisHata = 'Kullanıcı adı ve şifre boş bırakılamaz.';
      return;
    }
    this.cikisYukleniyor = true;
    this.cikisHata = null;
    this.authService.login(this.cikisKullaniciAdi.trim(), this.cikirSifre).subscribe({
      next: () => {
        this.authService.logout();
        this.cikisModalGoster = false;
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.cikisYukleniyor = false;
        this.cikisHata = err.status === 401 ? 'Kullanıcı adı veya şifre hatalı.' : 'Doğrulama sırasında bir hata oluştu.';
      }
    });
  }

  // --- İletişim ---
  iletisimAc(): void {
    this.iletisimModalGoster = true;
  }

  iletisimKapat(): void {
    this.iletisimModalGoster = false;
  }

  // --- Barkod ---
  barkodAc(): void {
    this.barkod = '';
    this.hata = null;
    this.araniyor = false;
    this.barkodModalGoster = true;
    setTimeout(() => this.barkodInputRef?.nativeElement.focus(), 100);
  }

  barkodKapat(): void {
    this.barkodModalGoster = false;
    this.barkod = '';
    this.hata = null;
    this.araniyor = false;
  }

  onBarkodGiris(): void {
    this.barkod = this.barkod.replace(/\D/g, '').slice(0, 13);
    this.hata = null;
    if (this.barkod.length === 13) {
      this.ara();
    }
  }

  ara(): void {
    if (this.araniyor) return;
    this.araniyor = true;
    this.hata = null;
    this.urunService.getByBarcode(this.barkod).subscribe({
      next: (res) => {
        this.barkodKapat();
        this.router.navigate(['/urunler', res.data.id]);
      },
      error: () => {
        this.hata = `"${this.barkod}" barkoduna sahip ürün bulunamadı.`;
        this.araniyor = false;
        this.barkod = '';
        setTimeout(() => this.barkodInputRef?.nativeElement.focus(), 50);
      }
    });
  }

  // --- Resim Yükleme ---
  resimModalAc(): void {
    this.seciliUrunId = null;
    this.seciliTip = ResimTipi.Kapak;
    this.seciliDosya = null;
    this.dosyaOnizleme = null;
    this.resimHata = null;
    this.resimBasari = null;
    this.resimYukleniyor = false;
    this.resimModalGoster = true;
  }

  resimModalKapat(): void {
    this.resimModalGoster = false;
  }

  onDosyaSec(event: Event): void {
    const input = event.target as HTMLInputElement;
    const dosya = input.files?.[0] ?? null;
    this.seciliDosya = dosya;
    this.dosyaOnizleme = null;
    if (dosya) {
      const reader = new FileReader();
      reader.onload = (e) => { this.dosyaOnizleme = e.target?.result as string; };
      reader.readAsDataURL(dosya);
    }
  }

  resimYukle(): void {
    if (!this.seciliUrunId || !this.seciliDosya) {
      this.resimHata = 'Lütfen ürün seçin ve bir resim dosyası ekleyin.';
      return;
    }
    this.resimYukleniyor = true;
    this.resimHata = null;
    this.resimBasari = null;

    this.urunService.resimYukle(this.seciliUrunId, this.seciliTip, this.seciliDosya).subscribe({
      next: () => {
        this.resimYukleniyor = false;
        this.resimBasari = 'Resim başarıyla yüklendi.';
        this.seciliDosya = null;
        this.dosyaOnizleme = null;
        setTimeout(() => { this.resimBasari = null; }, 3000);
      },
      error: () => {
        this.resimYukleniyor = false;
        this.resimHata = 'Resim yüklenirken bir hata oluştu.';
      }
    });
  }
}