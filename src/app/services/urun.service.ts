import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Urun, CreateUrunDto, UrunUpdateDto } from '../Models/UrunDtos/urun.model';
import { environment } from '../../environments/environment';
import { IDataResult, IResult } from '../Models/result.model';

@Injectable({
  providedIn: 'root'
})
export class UrunService {
  private baseUrl = `${environment.apiUrl}/api/Urun`;
  private uzunAciklamaUrl = `${environment.apiUrl}/api/urunUzunAciklama`;

  constructor(private http: HttpClient) {}

  getAll(lang = 'tr'): Observable<IDataResult<Urun[]>> {
    return this.http.get<IDataResult<Urun[]>>(`${this.baseUrl}/getAll?lang=${lang}`);
  }

  getByCategoryId(kategoriId: number, lang = 'tr'): Observable<IDataResult<Urun[]>> {
    return this.http.get<IDataResult<Urun[]>>(`${this.baseUrl}/getByCategoryId/${kategoriId}?lang=${lang}`);
  }

  getById(id: number, lang = 'tr'): Observable<IDataResult<Urun>> {
    return this.http.get<IDataResult<Urun>>(`${this.baseUrl}/getById/${id}?lang=${lang}`);
  }

  getByBarcode(barkod: string): Observable<IDataResult<Urun>> {
    return this.http.get<IDataResult<Urun>>(`${this.baseUrl}/getByBarcode/${barkod}`);
  }

  add(dto: CreateUrunDto): Observable<IResult> {
    return this.http.post<IResult>(`${this.baseUrl}/add`, dto);
  }

  update(id: number, dto: UrunUpdateDto): Observable<IResult> {
    return this.http.put<IResult>(`${this.baseUrl}/update/${id}`, dto);
  }

  delete(id: number): Observable<IResult> {
    return this.http.delete<IResult>(`${this.baseUrl}/delete/${id}`);
  }

  addSemptom(urunId: number, semptomId: number): Observable<IResult> {
    return this.http.post<IResult>(`${this.baseUrl}/addSemptom/${urunId}/${semptomId}`, null);
  }

  addUzunAciklama(payload: { urunId: number; translations: { language: string; metin: string }[] }): Observable<IResult> {
    return this.http.post<IResult>(`${this.uzunAciklamaUrl}/add`, payload);
  }

  updateUzunAciklama(id: number, translations: { id: number; language: string; metin: string }[]): Observable<IResult> {
    return this.http.put<IResult>(`${this.uzunAciklamaUrl}/update/${id}`, translations);
  }

  deleteUzunAciklama(id: number): Observable<IResult> {
    return this.http.delete<IResult>(`${this.uzunAciklamaUrl}/delete/${id}`);
  }

  resimSil(resimId: number): Observable<IResult> {
    return this.http.delete<IResult>(`${environment.apiUrl}/api/UrunResim/delete/${resimId}`);
  }

  resimYukle(urunId: number, tip: number, dosya: File): Observable<IResult> {
    const formData = new FormData();
    formData.append('file', dosya);
    formData.append('urunId', urunId.toString());
    formData.append('tip', tip.toString());
    return this.http.post<IResult>(`${environment.apiUrl}/api/UrunResim/add`, formData);
  }
}

