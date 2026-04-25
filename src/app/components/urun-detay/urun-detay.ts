import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar';
import { UrunService } from '../../services/urun.service';
import { KategoriService } from '../../services/kategori.service';
import { LangService, DILLER } from '../../services/lang.service';
import { AuthService } from '../../services/auth.service';
import { Urun } from '../../Models/UrunDtos/urun.model';
import { KategoriListDto } from '../../Models/KategoriDtos/kategori.model';
import { KapakResimPipe } from '../../pipes/kapak-resim.pipe';
import { IcerikResimPipe } from '../../pipes/icerik-resim.pipe';
import Swal from 'sweetalert2';

interface UzunAciklama { id: number; metin: string; }
interface UzunAciklamaTranslationForm { language: string; bayrakUrl: string; metin: string; }

@Component({
  selector: 'app-urun-detay',
  imports: [NavbarComponent, CommonModule, RouterLink, FormsModule, KapakResimPipe, IcerikResimPipe],
  templateUrl: './urun-detay.html',
  styleUrl: './urun-detay.css',
})
export class UrunDetayComponent implements OnInit, OnDestroy {
  urun: Urun | null = null;
  uzunAciklamalar: UzunAciklama[] = [];
  semptomlar: string[] = [];
  kategoriler: KategoriListDto[] = [];
  yukleniyor = true;
  hata: string | null = null;
  basariMesaji: string | null = null;

  private urunId!: number;
  private langSub!: Subscription;

  get t() { return this.langService.t; }

  // Ekle / Düzenle modal
  uzunAciklamaModalGoster = false;
  uzunAciklamaDuzenlemeId: number | null = null;
  uzunAciklamaTranslations: UzunAciklamaTranslationForm[] = [];
  modalYukleniyor = false;

  // Text-to-speech
  okuyorMu = false;
  private ttsUtterance: SpeechSynthesisUtterance | null = null;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private urunService: UrunService,
    private kategoriService: KategoriService,
    private langService: LangService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.hata = 'Geçersiz ürün ID.'; this.yukleniyor = false; return; }
    this.urunId = id;

    this.kategoriService.getAll(this.langService.aktifDil).subscribe({
      next: (res) => { this.kategoriler = res.data; }
    });

    this.langSub = this.langService.aktifDil$.subscribe(lang => {
      this.kategoriService.getAll(lang).subscribe({ next: (res) => { this.kategoriler = res.data; } });
      this.urunYukle(lang);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  getKategoriAdi(): string | null {
    if (!this.urun?.kategoriId) return null;
    return this.kategoriler.find(k => k.id === this.urun!.kategoriId)?.name ?? null;
  }

  private urunYukle(lang: string): void {
    this.yukleniyor = true;
    this.urunService.getById(this.urunId, lang).subscribe({
      next: (res) => {
        this.urun = res.data;
        this.semptomlar = res.data.semptomlar ?? [];
        this.uzunAciklamalar = res.data.uzunAciklamalar ?? [];
        this.yukleniyor = false;
      },
      error: () => {
        this.hata = 'Ürün bilgileri yüklenirken hata oluştu.';
        this.yukleniyor = false;
      }
    });
  }

  // --- DİL KODUNA GÖRE TTS ---
  ttsToggle(): void {
    if (this.okuyorMu) {
      speechSynthesis.cancel();
      this.okuyorMu = false;
      return;
    }
    
    if (this.uzunAciklamalar.length === 0) return;

    const birlesikMetin = this.uzunAciklamalar.map(a => a.metin).join('. ');
    const aktifDil = this.langService.aktifDil;

    const dilHaritasi: Record<string, string> = {
      tr: 'tr-TR',
      en: 'en-US',
      de: 'de-DE',
      ru: 'ru-RU',
      pl: 'pl-PL'
    };
    const bcp47 = dilHaritasi[aktifDil] ?? 'tr-TR';
    const dilKodu = bcp47.split('-')[0];

    const konustur = () => {
      const sesler = speechSynthesis.getVoices();
      if (sesler.length === 0) return;

      this.ttsUtterance = new SpeechSynthesisUtterance(birlesikMetin);

      const normLang = (l: string) => l.toLowerCase().replace('_', '-');
      const hedefSes =
        sesler.find(v => normLang(v.lang) === normLang(bcp47)) ??
        sesler.find(v => normLang(v.lang).startsWith(dilKodu)) ??
        sesler[0];

      this.ttsUtterance.voice = hedefSes;
      this.ttsUtterance.lang = bcp47;
      this.ttsUtterance.pitch = 1.0;
      this.ttsUtterance.rate = 0.95;

      this.ttsUtterance.onstart = () => { this.okuyorMu = true; };
      this.ttsUtterance.onend = () => { this.okuyorMu = false; };
      this.ttsUtterance.onerror = () => { this.okuyorMu = false; };

      this.okuyorMu = true;
      speechSynthesis.speak(this.ttsUtterance);
    };

    // cancel() sonrası Chrome'da küçük gecikme gerekli
    speechSynthesis.cancel();
    if (speechSynthesis.getVoices().length > 0) {
      setTimeout(konustur, 100);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        setTimeout(konustur, 100);
      };
    }
  }
  icerikResimSil(): void {
    if (!this.urun?.icerikResimId) return;
    Swal.fire({
      title: 'İçerik Resmi Silinsin mi?',
      text: 'Bu işlem geri alınamaz.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sil',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.urunService.resimSil(this.urun!.icerikResimId!).subscribe({
        next: () => {
          this.urun!.icerikResimId = null;
          this.urun!.icerikResimYolu = null;
          Swal.fire({ icon: 'success', title: 'Resim silindi', timer: 1500, showConfirmButton: false });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Resim silinemedi' })
      });
    });
  }

  uzunAciklamaEkleAc(): void {
    this.uzunAciklamaDuzenlemeId = null;
    this.uzunAciklamaTranslations = DILLER.map(d => ({ language: d.kod, bayrakUrl: d.bayrakUrl, metin: '' }));
    this.uzunAciklamaModalGoster = true;
  }

  uzunAciklamaDuzenleAc(item: UzunAciklama): void {
    this.uzunAciklamaDuzenlemeId = item.id;
    this.uzunAciklamaTranslations = DILLER.map(d => ({ language: d.kod, bayrakUrl: d.bayrakUrl, metin: '' }));
    this.modalYukleniyor = true;
    this.uzunAciklamaModalGoster = true;

    forkJoin(
      DILLER.map(d => this.urunService.getById(this.urunId, d.kod))
    ).subscribe(results => {
      results.forEach((res, i) => {
        const eslesen = (res.data.uzunAciklamalar ?? []).find(u => u.id === item.id);
        if (eslesen) {
          this.uzunAciklamaTranslations[i].metin = eslesen.metin;
        }
      });
      this.modalYukleniyor = false;
    });
  }

  uzunAciklamaEkleKapat(): void {
    this.uzunAciklamaModalGoster = false;
  }

  uzunAciklamaKaydet(): void {
    if (!this.urun) return;
    const dolu = this.uzunAciklamaTranslations.filter(t => t.metin.trim());
    if (dolu.length === 0) return;

    if (this.uzunAciklamaDuzenlemeId !== null) {
      const id = this.uzunAciklamaDuzenlemeId;
      const payload = dolu.map(t => ({ id: 0, language: t.language, metin: t.metin.trim() }));
      this.urunService.updateUzunAciklama(id, payload).subscribe({
        next: () => {
          this.urunService.getById(this.urun!.id, this.langService.aktifDil).subscribe(res => {
            this.uzunAciklamalar = res.data.uzunAciklamalar ?? [];
          });
          this.uzunAciklamaModalGoster = false;
          this.basariMesaji = 'Güncellendi.';
          setTimeout(() => (this.basariMesaji = null), 3000);
        },
        error: () => { this.hata = 'Güncelleme sırasında hata oluştu.'; setTimeout(() => (this.hata = null), 3000); }
      });
    } else {
      const payload = { urunId: this.urun.id, translations: dolu.map(t => ({ language: t.language, metin: t.metin.trim() })) };
      this.urunService.addUzunAciklama(payload).subscribe({
        next: () => {
          this.urunService.getById(this.urun!.id, this.langService.aktifDil).subscribe(res => {
            this.uzunAciklamalar = res.data.uzunAciklamalar ?? [];
          });
          this.uzunAciklamaModalGoster = false;
          this.basariMesaji = 'Detaylı bilgi eklendi.';
          setTimeout(() => (this.basariMesaji = null), 3000);
        },
        error: () => { this.hata = 'Kayıt sırasında hata oluştu.'; setTimeout(() => (this.hata = null), 3000); }
      });
    }
  }

  uzunAciklamaSil(item: UzunAciklama): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu detaylı bilgi silinecek.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(30, 150, 8)',
      cancelButtonColor: '#e53935',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.urunService.deleteUzunAciklama(item.id).subscribe({
        next: () => {
          this.uzunAciklamalar = this.uzunAciklamalar.filter(u => u.id !== item.id);
          this.basariMesaji = 'Silindi.';
          setTimeout(() => (this.basariMesaji = null), 3000);
        },
        error: () => { this.hata = 'Silme sırasında hata oluştu.'; setTimeout(() => (this.hata = null), 3000); }
      });
    });
  }

  resimSil(resimId: number, tip: 'kapak' | 'icerik'): void {
    Swal.fire({
      title: 'Resmi Sil',
      text: `${tip === 'kapak' ? 'Kapak' : 'İçerik'} resmini silmek istediğinizden emin misiniz?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#777',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.urunService.resimSil(resimId).subscribe({
        next: () => {
          if (this.urun) {
            if (tip === 'kapak') { this.urun.kapakResimId = null; this.urun.kapakResimYolu = null; }
            else { this.urun.icerikResimId = null; this.urun.icerikResimYolu = null; }
          }
          this.basariMesaji = 'Resim silindi.';
          setTimeout(() => (this.basariMesaji = null), 3000);
        },
        error: () => { this.hata = 'Resim silinirken hata oluştu.'; setTimeout(() => (this.hata = null), 3000); }
      });
    });
  }
}