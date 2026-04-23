import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Semptom, CreateSemptomDto } from '../Models/SemptomDtos/semptom.model';
import { Urun } from '../Models/UrunDtos/urun.model';
import { environment } from '../../environments/environment';
import { IDataResult, IResult } from '../Models/result.model';

@Injectable({
  providedIn: 'root'
})
export class SemptomService {
  private baseUrl = `${environment.apiUrl}/api/Semptom`;

  constructor(private http: HttpClient) {}

  getAll(lang = 'tr'): Observable<IDataResult<Semptom[]>> {
    return this.http.get<IDataResult<Semptom[]>>(`${this.baseUrl}/getall?lang=${lang}`);
  }

  getById(id: number, lang = 'tr'): Observable<IDataResult<Semptom>> {
    return this.http.get<IDataResult<Semptom>>(`${this.baseUrl}/getbyid/${id}?lang=${lang}`);
  }

  add(dto: CreateSemptomDto): Observable<IResult> {
    return this.http.post<IResult>(`${this.baseUrl}/add`, dto);
  }

  update(id: number, dto: CreateSemptomDto): Observable<IResult> {
    return this.http.put<IResult>(`${this.baseUrl}/update/${id}`, dto.translations);
  }

  delete(id: number): Observable<IResult> {
    return this.http.delete<IResult>(`${this.baseUrl}/delete/${id}`);
  }

  analiz(ids: number[], lang = 'tr'): Observable<IDataResult<Urun[]>> {
    return this.http.post<IDataResult<Urun[]>>(`${this.baseUrl}/Analiz?lang=${lang}`, ids);
  }

  getByUrunId(urunId: number): Observable<IDataResult<any[]>> {
    return this.http.get<IDataResult<any[]>>(`${this.baseUrl}/getbyurun/${urunId}`);
  }
}
