import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { IDataResult } from '../Models/result.model';

interface TokenPayload {
  nameid: string;
  unique_name: string;
  ip_address: string;
  lisans_bitis: string;
  role: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'vp_token';
  private readonly SERVER_OFFSET_KEY = 'vp_time_offset';

  constructor(private http: HttpClient) {}

  login(kullaniciAdi: string, sifre: string): Observable<IDataResult<string>> {
    return this.http.post<IDataResult<string>>(`${environment.apiUrl}/api/Auth/login`, { UserName: kullaniciAdi, Password: sifre }).pipe(
      tap(res => {
        if (res?.data) {
          localStorage.setItem(this.TOKEN_KEY, res.data);
          try {
            const parts = res.data.split('.');
            const payload = JSON.parse(atob(parts[1]));
            const offset = (payload.iat * 1000) - Date.now();
            localStorage.setItem(this.SERVER_OFFSET_KEY, offset.toString());
          } catch {}
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.SERVER_OFFSET_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  decodeToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as TokenPayload;
    } catch {
      return null;
    }
  }

  getIpFromToken(): string | null {
    return this.decodeToken()?.ip_address ?? null;
  }

  getKullanici(): string | null {
    return this.decodeToken()?.unique_name ?? null;
  }

  isAdmin(): boolean {
    return this.decodeToken()?.role === 'Admin';
  }

  getServerNow(): Date {
    const offsetStr = localStorage.getItem(this.SERVER_OFFSET_KEY);
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return new Date(Date.now() + offset);
  }

  getLisansBitis(): Date | null {
    const payload = this.decodeToken();
    if (!payload?.lisans_bitis) return null;
    return new Date(payload.lisans_bitis);
  }

  getLisansKalanGun(): number | null {
    const bitis = this.getLisansBitis();
    if (!bitis) return null;
    const diffMs = bitis.getTime() - this.getServerNow().getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  girisSepeti(): boolean {
    const payload = this.decodeToken();
    if (!payload) return false;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      this.logout();
      return false;
    }
    return true;
  }

  getAllowedIps(): Observable<IDataResult<string>> {
    return this.http.get<IDataResult<string>>(`${environment.apiUrl}/api/Auth/getAllowedIps`);
  }

  getUserCompanyName(): Observable<string> {
    return this.http.get(`${environment.apiUrl}/api/auth/getUserCompanyName`, { responseType: 'text' });
  }
}
