import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin, of, Subject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NavbarComponent } from '../navbar/navbar';
import { UrunService } from '../../services/urun.service';
import { KategoriService } from '../../services/kategori.service';
import { LangService, DILLER } from '../../services/lang.service';
import { AuthService } from '../../services/auth.service';
import { Urun, CreateUrunDto, UrunUpdateDto } from '../../Models/UrunDtos/urun.model';
import { KategoriListDto } from '../../Models/KategoriDtos/kategori.model';
import { KapakResimPipe } from '../../pipes/kapak-resim.pipe';

interface TranslationForm {
  language: string;
  bayrakUrl: string;
  urunAdi: string;
  aciklama: string;
}

@Component({
  selector: 'app-main-page',
  imports: [NavbarComponent, CommonModule, FormsModule, KapakResimPipe],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPageComponent implements OnInit, OnDestroy {
  urunler: Urun[] = [];
  kategoriler: KategoriListDto[] = [];
  yukleniyor = true;
  hata: string | null = null;
  basariMesaji: string | null = null;
  lisansKalanGun: number | null = null;
  isAdmin = false;

  aktifDil = 'tr';
  private langSub!: Subscription;

  get t() { return this.langService.t; }

  // Kategori filtresi
  filtreKategoriId: number | null = null;
  filtreKategoriAdi: string | null = null;

  // Ekle/Güncelle modal
  modalGoster = false;
  modalYukleniyor = false;
  duzenlemeModunda = false;
  seciliId: number | null = null;
  barkodForm = '';
  kategoriIdForm: number | null = null;
  translations: TranslationForm[] = [];

  // Sil modal
  silOnayGoster = false;
  silinecekId: number | null = null;

  // Resim sil
  resimSilOnayGoster = false;
  silinecekResimId: number | null = null;

  private routeSub!: Subscription;
  private urunSub!: Subscription;
  private yukle$ = new Subject<{ kategoriId: number | null; dil: string }>();

  constructor(
    private urunService: UrunService,
    private kategoriService: KategoriService,
    private route: ActivatedRoute,
    private router: Router,
    private langService: LangService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.lisansKalanGun = this.authService.getLisansKalanGun();
    this.isAdmin = this.authService.isAdmin();
    // switchMap: yeni istek gelince öncekini iptal eder
    this.urunSub = this.yukle$.pipe(
      switchMap(({ kategoriId, dil }) => {
        this.yukleniyor = true;
        this.hata = null;
        if (kategoriId) {
          return forkJoin({
            urunler: this.urunService.getByCategoryId(kategoriId, dil),
            kategoriler: this.kategoriService.getAll(dil)
          }).pipe(
            map(({ urunler, kategoriler }) => {
              this.kategoriler = kategoriler.data;
              const kat = kategoriler.data.find((k: any) => k.id === kategoriId);
              return { data: urunler.data, kategoriAdi: kat?.name ?? null };
            }),
            catchError(() => { this.hata = 'Ürünler yüklenirken bir hata oluştu.'; this.yukleniyor = false; return of(null); })
          );
        } else {
          return forkJoin({
            urunler: this.urunService.getAll(dil),
            kategoriler: this.kategoriService.getAll(dil)
          }).pipe(
            map(({ urunler, kategoriler }) => {
              this.kategoriler = kategoriler.data;
              return { data: urunler.data, kategoriAdi: null };
            }),
            catchError(() => { this.hata = 'Ürünler yüklenirken bir hata oluştu.'; this.yukleniyor = false; return of(null); })
          );
        }
      })
    ).subscribe(result => {
      if (!result) return;
      this.urunler = result.data;
      this.yukleniyor = false;
      if (result.kategoriAdi !== null) {
        this.filtreKategoriAdi = result.kategoriAdi;
      }
    });

    this.langSub = this.langService.aktifDil$.subscribe(dil => {
      this.aktifDil = dil;
      this.yukle$.next({ kategoriId: this.filtreKategoriId, dil });
    });

    this.routeSub = this.route.queryParams.subscribe((params) => {
      if (params['ekle'] === '1') {
        this.yeniUrunAc();
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
      const kid = params['kategoriId'];
      if (kid) {
        this.filtreKategoriId = +kid;
      } else {
        this.filtreKategoriId = null;
        this.filtreKategoriAdi = null;
      }
      this.yukle$.next({ kategoriId: this.filtreKategoriId, dil: this.aktifDil });
    });
  }

  urunlereGit(id: number): void {
    this.router.navigate(['/urunler', id]);
  }

  kategorilereGit(): void {
    this.router.navigate(['/kategoriler']);
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.urunSub?.unsubscribe();
    this.yukle$.complete();
  }

  verileriYukle(): void {
    this.yukle$.next({ kategoriId: this.filtreKategoriId, dil: this.aktifDil });
  }

  private bosTranslations(): TranslationForm[] {
    return DILLER.map(d => ({ language: d.kod, bayrakUrl: d.bayrakUrl, urunAdi: '', aciklama: '' }));
  }

  yeniUrunAc(): void {
    this.duzenlemeModunda = false;
    this.seciliId = null;
    this.barkodForm = '';
    this.kategoriIdForm = null;
    this.translations = this.bosTranslations();
    this.modalGoster = true;
  }

  duzenleAc(urun: Urun): void {
    this.duzenlemeModunda = true;
    this.seciliId = urun.id;
    this.barkodForm = urun.barkod ?? '';
    this.kategoriIdForm = urun.kategoriId ?? null;
    this.translations = this.bosTranslations();
    this.modalYukleniyor = true;
    this.modalGoster = true;

    const id = urun.id;
    forkJoin(
      DILLER.map(d =>
        this.urunService.getAll(d.kod).pipe(
          map(res => ({ lang: d.kod, item: res.data.find(u => u.id === id) })),
          catchError(() => of({ lang: d.kod, item: undefined }))
        )
      )
    ).subscribe(results => {
      results.forEach(r => {
        const t = this.translations.find(t => t.language === r.lang);
        if (t && r.item) {
          t.urunAdi = r.item.urunAdi ?? '';
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
    const doluTranslations = this.translations.filter(t => t.urunAdi.trim());
    if (doluTranslations.length === 0) return;

    if (this.duzenlemeModunda && this.seciliId !== null) {
      const updateDto: UrunUpdateDto = {
        barkod: this.barkodForm.trim() || undefined,
        kategoriId: this.kategoriIdForm ?? undefined,
        translations: doluTranslations.map(t => ({
          language: t.language,
          urunAdi: t.urunAdi.trim(),
          aciklama: t.aciklama.trim() || undefined
        }))
      };
      this.urunService.update(this.seciliId, updateDto).subscribe({
        next: () => { this.basariGoster('Ürün başarıyla güncellendi.'); this.modalGoster = false; this.verileriYukle(); },
        error: () => { this.hata = 'Güncelleme sırasında hata oluştu.'; }
      });
    } else {
      const dto: CreateUrunDto = {
        barkod: this.barkodForm.trim() || undefined,
        kategoriId: this.kategoriIdForm ?? undefined,
        translations: doluTranslations.map(t => ({
          language: t.language,
          urunAdi: t.urunAdi.trim(),
          aciklama: t.aciklama.trim() || undefined
        }))
      };
      this.urunService.add(dto).subscribe({
        next: () => { this.basariGoster('Ürün başarıyla eklendi.'); this.modalGoster = false; this.verileriYukle(); },
        error: () => { this.hata = 'Ekleme sırasında hata oluştu.'; }
      });
    }
  }

  silOnayAc(id: number): void {
    this.silinecekId = id;
    this.silOnayGoster = true;
  }

  resimSilOnayAc(resimId: number): void {
    this.silinecekResimId = resimId;
    this.resimSilOnayGoster = true;
  }

  resimSilOnayKapat(): void {
    this.resimSilOnayGoster = false;
    this.silinecekResimId = null;
  }

  resimSilOnayla(): void {
    if (this.silinecekResimId === null) return;
    this.urunService.resimSil(this.silinecekResimId).subscribe({
      next: () => { this.basariGoster('Resim başarıyla silindi.'); this.resimSilOnayGoster = false; this.silinecekResimId = null; this.verileriYukle(); },
      error: () => { this.hata = 'Resim silinirken bir hata oluştu.'; this.resimSilOnayGoster = false; }
    });
  }

  silOnayKapat(): void {
    this.silOnayGoster = false;
    this.silinecekId = null;
  }

  silOnayla(): void {
    if (this.silinecekId === null) return;
    this.urunService.delete(this.silinecekId).subscribe({
      next: () => { this.basariGoster('Ürün başarıyla silindi.'); this.silOnayGoster = false; this.silinecekId = null; this.verileriYukle(); },
      error: () => { this.hata = 'Silme sırasında hata oluştu.'; }
    });
  }

  getKategoriAdi(kategoriId: number | null | undefined): string {
    if (!kategoriId) return this.t.kategoriYok;
    return this.kategoriler.find(k => k.id === kategoriId)?.name ?? this.t.kategoriYok;
  }

  private basariGoster(mesaj: string): void {
    this.basariMesaji = mesaj;
    setTimeout(() => { this.basariMesaji = null; }, 3000);
  }
}
