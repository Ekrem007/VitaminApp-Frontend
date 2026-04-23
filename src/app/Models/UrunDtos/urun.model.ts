import { Kategori } from '../KategoriDtos/kategori.model';

export interface UrunTranslation {
  id: number;
  language: string;
  urunAdi: string;
  aciklama: string;
  urunId: number;
}

export interface UrunUzunAciklamaTranslation {
  id: number;
  language: string;
  metin: string;
  urunUzunAciklamaId: number;
}

export interface UrunUzunAciklama {
  id: number;
  urunId: number;
  translations?: UrunUzunAciklamaTranslation[];
}

export interface Urun {
  id: number;
  urunAdi?: string;
  barkod?: string;
  aciklama?: string;
  kategoriId?: number | null;
  kategoriAdi?: string | null;
  kapakResimId?: number | null;
  kapakResimYolu?: string | null;
  icerikResimId?: number | null;
  icerikResimYolu?: string | null;
  uzunAciklamalar?: { id: number; metin: string }[] | null;
  semptomlar?: string[] | null;
  kategori?: Kategori;
  translations?: UrunTranslation[];
}

// --- DTOs ---
export interface UrunTranslationDto {
  id?: number;
  language: string;
  urunAdi: string;
  aciklama?: string;
}

export interface CreateUrunDto {
  barkod?: string;
  kategoriId?: number;
  translations: UrunTranslationDto[];
}

export interface UrunUpdateDto {
  barkod?: string;
  kategoriId?: number;
  translations: UrunTranslationDto[];
}
