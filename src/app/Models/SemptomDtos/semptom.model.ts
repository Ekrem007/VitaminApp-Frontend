export interface SemptomTranslation {
  id: number;
  language: string;
  aciklama: string;
  semptomId: number;
}

export interface Semptom {
  id: number;
  translationId?: number;
  aciklama?: string;
  translations?: SemptomTranslation[];
}

// --- DTOs ---
export interface SemptomTranslationDto {
  id?: number;
  language: string;
  aciklama: string;
}

export interface CreateSemptomDto {
  translations: SemptomTranslationDto[];
}
