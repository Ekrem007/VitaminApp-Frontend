import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UI_TRANSLATIONS, UiTranslations, UiLang } from '../i18n/ui-translations';

export interface Dil {
  kod: string;
  bayrakUrl: string;
  ad: string;
}

export const DILLER: Dil[] = [
  { kod: 'tr', bayrakUrl: 'https://flagcdn.com/w40/tr.png', ad: 'Türkçe' },
  { kod: 'en', bayrakUrl: 'https://flagcdn.com/w40/gb.png', ad: 'English' },
  { kod: 'ru', bayrakUrl: 'https://flagcdn.com/w40/ru.png', ad: 'Русский' },
  { kod: 'de', bayrakUrl: 'https://flagcdn.com/w40/de.png', ad: 'Deutsch' },
  { kod: 'pl', bayrakUrl: 'https://flagcdn.com/w40/pl.png', ad: 'Polski' },
];

@Injectable({ providedIn: 'root' })
export class LangService {
  private _aktifDil = new BehaviorSubject<string>('tr');
  aktifDil$ = this._aktifDil.asObservable();
  readonly diller = DILLER;

  get aktifDil(): string {
    return this._aktifDil.value;
  }

  get t(): UiTranslations {
    const kod = this._aktifDil.value as UiLang;
    return UI_TRANSLATIONS[kod] ?? UI_TRANSLATIONS['tr'];
  }

  dilSec(kod: string): void {
    this._aktifDil.next(kod);
  }
}
