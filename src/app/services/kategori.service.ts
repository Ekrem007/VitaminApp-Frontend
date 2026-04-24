import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Kategori, KategoriListDto, CreateCategoryDto } from '../Models/KategoriDtos/kategori.model';
import { environment } from '../../environments/environment';
import { IDataResult, IResult } from '../Models/result.model';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class KategoriService {
  private baseUrl = `${environment.apiUrl}/api/Category`;

  constructor(private http: HttpClient, private cache: CacheService) {}

  getAll(lang = 'tr'): Observable<IDataResult<KategoriListDto[]>> {
    const key = `kat_all_${lang}`;
    const cached = this.cache.get<IDataResult<KategoriListDto[]>>(key);
    if (cached) return of(cached);
    return this.http.get<IDataResult<KategoriListDto[]>>(`${this.baseUrl}/getall?lang=${lang}`).pipe(
      tap(res => { if (res?.success) this.cache.set(key, res); })
    );
  }

  getById(id: number, lang = 'tr'): Observable<IDataResult<Kategori>> {
    return this.http.get<IDataResult<Kategori>>(`${this.baseUrl}/getbyid/${id}?lang=${lang}`);
  }

  add(dto: CreateCategoryDto): Observable<IResult> {
    return this.http.post<IResult>(`${this.baseUrl}/add`, dto);
  }

  update(id: number, dto: CreateCategoryDto): Observable<IResult> {
    return this.http.put<IResult>(`${this.baseUrl}/update/${id}`, dto.translations);
  }

  delete(id: number): Observable<IResult> {
    return this.http.delete<IResult>(`${this.baseUrl}/delete/${id}`);
  }
}
