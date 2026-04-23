import { Urun } from '../UrunDtos/urun.model';

// API'den dönen liste DTO'su (getAll?lang=tr)
export interface KategoriListDto {
  id: number;
  translationId?: number;
  name?: string;
  description?: string;
}

export interface CategoryTranslation {
  id: number;
  language: string;
  kategoriAdi: string;
  kategoriAciklama?: string;
  categoryId: number;
}

export interface Kategori {
  id: number;
  kategoriAdi?: string;
  kategoriAciklama?: string;
  translations?: CategoryTranslation[];
  urunler?: Urun[];
}

// --- DTOs ---
export interface CategoryTranslationDto {
  id?: number;
  language: string;
  kategoriAdi: string;
  kategoriAciklama?: string;
}

export interface CreateCategoryDto {
  translations: CategoryTranslationDto[];
}
