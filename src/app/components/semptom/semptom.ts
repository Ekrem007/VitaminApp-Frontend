import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NavbarComponent } from '../navbar/navbar';
import { SemptomService } from '../../services/semptom.service';
import { UrunService } from '../../services/urun.service';
import { KategoriService } from '../../services/kategori.service';
import { LangService, DILLER } from '../../services/lang.service';
import { AuthService } from '../../services/auth.service';
import { KapakResimPipe } from '../../pipes/kapak-resim.pipe';
import { Semptom, CreateSemptomDto } from '../../Models/SemptomDtos/semptom.model';
import { Urun } from '../../Models/UrunDtos/urun.model';
import { KategoriListDto } from '../../Models/KategoriDtos/kategori.model';
import Swal from 'sweetalert2';

interface SemptomTranslationForm {
  translationId?: number;
  language: string;
  bayrakUrl: string;
  aciklama: string;
}

@Component({
  selector: 'app-semptom',
  imports: [NavbarComponent, CommonModule, FormsModule, KapakResimPipe],
  templateUrl: './semptom.html',
  styleUrl: './semptom.css',
})
export class SemptomComponent implements OnInit, OnDestroy {
  semptomlar: Semptom[] = [];
  yukleniyor = true;
  hata: string | null = null;
  basariMesaji: string | null = null;

  aktifDil = 'tr';
  private langSub!: Subscription;

  get t() { return this.langService.t; }

  // Tablo toggle
  tablGoster = false;

  // Semptom seçimi
  secilenSemptomIds = new Set<number>();
  aramaMetni = '';

  get filtrelenmis(): Semptom[] {
    const q = this.aramaMetni.toLowerCase().trim();
    if (!q) return this.semptomlar;
    return this.semptomlar.filter(s => s.aciklama?.toLowerCase().includes(q));
  }

  get secilenSemptomlar(): Semptom[] {
    return this.semptomlar.filter(s => this.secilenSemptomIds.has(s.id));
  }

  // Analiz
  onerilenUrunler: Urun[] = [];
  analizYapildi = false;
  analizYukleniyor = false;
  analizModalGoster = false;
  kategoriler: KategoriListDto[] = [];

  // Yönetim modalleri
  modalGoster = false;
  modalYukleniyor = false;
  duzenlemeModunda = false;
  seciliId: number | null = null;
  translations: SemptomTranslationForm[] = [];

  silOnayGoster = false;
  silinecekId: number | null = null;

  // Ürüne Semptom Ekle modal
  urunler: Urun[] = [];
  semptomEkleModalGoster = false;
  semptomEkleForm: { urunId: number | null; semptomId: number | null } = { urunId: null, semptomId: null };
  isAdmin = false;

  constructor(
    private semptomService: SemptomService,
    private urunService: UrunService,
    private langService: LangService,
    private kategoriService: KategoriService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.langSub = this.langService.aktifDil$.subscribe(dil => {
      this.aktifDil = dil;
      this.verileriYukle();
    });
    this.analizDurumunuGeriYukle();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  verileriYukle(): void {
    this.yukleniyor = true;
    this.hata = null;
    this.semptomService.getAll(this.aktifDil).subscribe({
      next: (res) => { this.semptomlar = res.data; this.yukleniyor = false; },
      error: () => { this.hata = 'Semptomlar yüklenirken bir hata oluştu.'; this.yukleniyor = false; }
    });
    this.urunService.getAll().subscribe({
      next: (res) => { this.urunler = res.data; },
      error: () => {}
    });
    this.kategoriService.getAll(this.aktifDil).subscribe({
      next: (res) => { this.kategoriler = res.data; },
      error: () => {}
    });
  }

  private bosTranslations(): SemptomTranslationForm[] {
    return DILLER.map(d => ({ language: d.kod, bayrakUrl: d.bayrakUrl, aciklama: '' }));
  }

  semptomEkleAc(): void {
    this.semptomEkleForm = { urunId: null, semptomId: null };
    this.semptomEkleModalGoster = true;
  }

  semptomEkleKapat(): void {
    this.semptomEkleModalGoster = false;
  }

  semptomEkleKaydet(): void {
    const { urunId, semptomId } = this.semptomEkleForm;
    if (!urunId || !semptomId) return;
    this.urunService.addSemptom(urunId, semptomId).subscribe({
      next: () => {
        this.basariMesaji = 'Semptom ürüne başarıyla eklendi.';
        this.semptomEkleModalGoster = false;
        setTimeout(() => (this.basariMesaji = null), 3000);
      },
      error: () => {
        this.hata = 'Semptom eklenirken bir hata oluştu.';
        setTimeout(() => (this.hata = null), 3000);
      }
    });
  }

  semptomSec(id: number): void {
    if (this.secilenSemptomIds.has(id)) {
      this.secilenSemptomIds.delete(id);
    } else {
      this.secilenSemptomIds.add(id);
    }
    this.secilenSemptomIds = new Set(this.secilenSemptomIds);
    this.analizYapildi = false;
  }

  secimiTemizle(): void {
    this.secilenSemptomIds = new Set<number>();
    this.analizYapildi = false;
    this.onerilenUrunler = [];
    this.analizModalGoster = false;
    sessionStorage.removeItem(this.ANALIZ_KEY);
  }

  analizEt(): void {
    if (this.secilenSemptomIds.size === 0) return;
    this.analizYukleniyor = true;
    this.analizYapildi = false;

    Swal.fire({
      title: this.t.analizEdiliyor,
      html: this.t.lutfenBekleyin,
      timer: 2000,
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
    }).then(() => {
      const ids = Array.from(this.secilenSemptomIds);
      this.semptomService.analiz(ids, this.aktifDil).subscribe({
        next: (res) => {
          this.onerilenUrunler = res.data.map(u => ({
            ...u,
            kategoriAdi: this.kategoriler.find(k => k.id === u.kategoriId)?.name ?? null
          }));
          this.analizYapildi = true;
          this.analizYukleniyor = false;
          this.analizModalGoster = true;
        },
        error: () => {
          this.hata = 'Analiz sırasında hata oluştu.';
          this.analizYukleniyor = false;
        }
      });
    });
  }

  private readonly ANALIZ_KEY = 'semptom_analiz_durumu';

  private analizDurumunuKaydet(): void {
    sessionStorage.setItem(this.ANALIZ_KEY, JSON.stringify({
      onerilenUrunler: this.onerilenUrunler,
      secilenSemptomIds: Array.from(this.secilenSemptomIds)
    }));
  }

  private analizDurumunuGeriYukle(): void {
    const kayitli = sessionStorage.getItem(this.ANALIZ_KEY);
    if (!kayitli) return;
    try {
      const durum = JSON.parse(kayitli);
      this.onerilenUrunler = durum.onerilenUrunler ?? [];
      this.secilenSemptomIds = new Set<number>(durum.secilenSemptomIds ?? []);
      if (this.onerilenUrunler.length > 0) {
        this.analizYapildi = true;
        this.analizModalGoster = true;
      }
    } catch { /* bozuk veri, yoksay */ }
  }

  analizModalKapat(): void {
    this.analizModalGoster = false;
    sessionStorage.removeItem(this.ANALIZ_KEY);
  }

  navigateToUrun(id: number): void {
    this.analizDurumunuKaydet();
    this.router.navigate(['/urunler', id]);
  }

  tablGosterToggle(): void {
    this.tablGoster = !this.tablGoster;
  }

  yeniSemptomAc(): void {
    this.duzenlemeModunda = false;
    this.seciliId = null;
    this.translations = this.bosTranslations();
    this.modalGoster = true;
  }

  duzenleAc(semptom: Semptom): void {
    this.duzenlemeModunda = true;
    this.seciliId = semptom.id;
    this.translations = this.bosTranslations();
    this.modalYukleniyor = true;
    this.modalGoster = true;

    const id = semptom.id;
    forkJoin(
      DILLER.map(d =>
        this.semptomService.getAll(d.kod).pipe(
          map(res => ({ lang: d.kod, item: res.data.find(s => s.id === id) })),
          catchError(() => of({ lang: d.kod, item: undefined }))
        )
      )
    ).subscribe(results => {
      results.forEach(r => {
        const t = this.translations.find(t => t.language === r.lang);
        if (t && r.item) {
          t.translationId = r.item.translationId;
          t.aciklama = r.item.aciklama ?? '';
        }
      });
      this.modalYukleniyor = false;
    });
  }

  modalKapat(): void {
    this.modalGoster = false;
  }

  kaydet(): void {
    const doluTranslations = this.translations.filter(t => t.aciklama.trim());
    if (doluTranslations.length === 0) return;

    const dto: CreateSemptomDto = {
      translations: doluTranslations.map(t => ({
        ...(this.duzenlemeModunda && t.translationId ? { id: t.translationId } : {}),
        language: t.language,
        aciklama: t.aciklama.trim()
      }))
    };

    if (this.duzenlemeModunda && this.seciliId !== null) {
      this.semptomService.update(this.seciliId, dto).subscribe({
        next: () => { this.basariGoster('Semptom başarıyla güncellendi.'); this.modalGoster = false; this.verileriYukle(); },
        error: () => { this.hata = 'Güncelleme sırasında hata oluştu.'; }
      });
    } else {
      this.semptomService.add(dto).subscribe({
        next: () => { this.basariGoster('Semptom başarıyla eklendi.'); this.modalGoster = false; this.verileriYukle(); },
        error: () => { this.hata = 'Ekleme sırasında hata oluştu.'; }
      });
    }
  }

  silOnayAc(id: number): void {
    this.silinecekId = id;
    this.silOnayGoster = true;
  }

  silOnayKapat(): void {
    this.silOnayGoster = false;
    this.silinecekId = null;
  }

  silOnayla(): void {
    if (this.silinecekId === null) return;
    this.semptomService.delete(this.silinecekId).subscribe({
      next: () => {
        this.basariGoster('Semptom başarıyla silindi.');
        this.silOnayGoster = false;
        this.silinecekId = null;
        this.verileriYukle();
      },
      error: () => { this.hata = 'Silme sırasında hata oluştu.'; }
    });
  }

  get onerilenUrunlerGruplu(): { kategoriAdi: string; urunler: Urun[] }[] {
    const gruplar = new Map<string, Urun[]>();
    for (const urun of this.onerilenUrunler) {
      const adi = urun.kategoriAdi ?? 'Kategori yok';
      if (!gruplar.has(adi)) gruplar.set(adi, []);
      gruplar.get(adi)!.push(urun);
    }
    return Array.from(gruplar.entries()).map(([kategoriAdi, urunler]) => ({ kategoriAdi, urunler: [...urunler].reverse() }));
  }

  private basariGoster(mesaj: string): void {
    this.basariMesaji = mesaj;
    setTimeout(() => { this.basariMesaji = null; }, 3000);
  }
}

