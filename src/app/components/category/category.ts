import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NavbarComponent } from '../navbar/navbar';
import { KategoriService } from '../../services/kategori.service';
import { UrunService } from '../../services/urun.service';
import { LangService, DILLER } from '../../services/lang.service';
import { AuthService } from '../../services/auth.service';
import { KategoriListDto, CreateCategoryDto } from '../../Models/KategoriDtos/kategori.model';

interface TranslationForm {
  translationId?: number;
  language: string;
  bayrakUrl: string;
  kategoriAdi: string;
  kategoriAciklama: string;
}

@Component({
  selector: 'app-category',
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class CategoryComponent implements OnInit, OnDestroy {
  kategoriler: KategoriListDto[] = [];
  urunSayilari = new Map<number, number>();
  yukleniyor = true;
  hata: string | null = null;
  basariMesaji: string | null = null;

  aktifDil = 'tr';
  private langSub!: Subscription;

  get t() { return this.langService.t; }

  modalGoster = false;
  modalYukleniyor = false;
  duzenlemeModunda = false;
  seciliId: number | null = null;
  translations: TranslationForm[] = [];

  silOnayGoster = false;
  silinecekId: number | null = null;
  isAdmin = false;

  constructor(
    private kategoriService: KategoriService,
    private urunService: UrunService,
    private langService: LangService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.langSub = this.langService.aktifDil$.subscribe(dil => {
      this.aktifDil = dil;
      this.verileriYukle();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  urunlereGit(kategoriId: number): void {
    this.router.navigate(['/anasayfa'], { queryParams: { kategoriId } });
  }

  verileriYukle(): void {
    this.yukleniyor = true;
    this.hata = null;
    this.kategoriService.getAll(this.aktifDil).subscribe({
      next: (res) => {
        this.kategoriler = res.data;
        this.yukleniyor = false;
      },
      error: () => {
        this.hata = 'Kategoriler yüklenirken bir hata oluştu.';
        this.yukleniyor = false;
      }
    });
    this.urunService.getAll().subscribe({
      next: (res) => {
        const sayilar = new Map<number, number>();
        res.data.forEach(u => {
          if (u.kategoriId != null) {
            sayilar.set(u.kategoriId, (sayilar.get(u.kategoriId) ?? 0) + 1);
          }
        });
        this.urunSayilari = sayilar;
      },
      error: () => {}
    });
  }

  private bosTranslations(): TranslationForm[] {
    return DILLER.map(d => ({ language: d.kod, bayrakUrl: d.bayrakUrl, kategoriAdi: '', kategoriAciklama: '' }));
  }

  yeniKategoriAc(): void {
    this.duzenlemeModunda = false;
    this.seciliId = null;
    this.translations = this.bosTranslations();
    this.modalGoster = true;
  }

  duzenleAc(kategori: KategoriListDto): void {
    this.duzenlemeModunda = true;
    this.seciliId = kategori.id;
    this.translations = this.bosTranslations();
    this.modalYukleniyor = true;
    this.modalGoster = true;

    const id = kategori.id;
    forkJoin(
      DILLER.map(d =>
        this.kategoriService.getAll(d.kod).pipe(
          map(res => ({ lang: d.kod, item: res.data.find(k => k.id === id) })),
          catchError(() => of({ lang: d.kod, item: undefined }))
        )
      )
    ).subscribe(results => {
      results.forEach(r => {
        const t = this.translations.find(t => t.language === r.lang);
        if (t && r.item) {
          t.translationId = r.item.translationId;
          t.kategoriAdi = r.item.name ?? '';
          t.kategoriAciklama = r.item.description ?? '';
        }
      });
      this.modalYukleniyor = false;
    });
  }

  modalKapat(): void {
    this.modalGoster = false;
  }

  kaydet(): void {
    const doluTranslations = this.translations.filter(t => t.kategoriAdi.trim());
    if (doluTranslations.length === 0) return;

    const dto: CreateCategoryDto = {
      translations: doluTranslations.map(t => ({
        ...(this.duzenlemeModunda && t.translationId ? { id: t.translationId } : {}),
        language: t.language,
        kategoriAdi: t.kategoriAdi.trim(),
        kategoriAciklama: t.kategoriAciklama.trim() || undefined
      }))
    };

    if (this.duzenlemeModunda && this.seciliId !== null) {
      this.kategoriService.update(this.seciliId, dto).subscribe({
        next: () => {
          this.basariGoster('Kategori başarıyla güncellendi.');
          this.modalGoster = false;
          this.verileriYukle();
        },
        error: () => { this.hata = 'Güncelleme sırasında hata oluştu.'; }
      });
    } else {
      this.kategoriService.add(dto).subscribe({
        next: () => {
          this.basariGoster('Kategori başarıyla eklendi.');
          this.modalGoster = false;
          this.verileriYukle();
        },
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
    this.kategoriService.delete(this.silinecekId).subscribe({
      next: () => {
        this.basariGoster('Kategori başarıyla silindi.');
        this.silOnayGoster = false;
        this.silinecekId = null;
        this.verileriYukle();
      },
      error: () => { this.hata = 'Silme sırasında hata oluştu.'; }
    });
  }

  private basariGoster(mesaj: string): void {
    this.basariMesaji = mesaj;
    setTimeout(() => { this.basariMesaji = null; }, 3000);
  }
}

