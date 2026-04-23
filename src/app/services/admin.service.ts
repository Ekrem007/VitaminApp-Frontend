import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IDataResult, IResult } from '../Models/result.model';

export interface AdminUser {
  id: string;
  name: string;
  userName: string;
  phoneNumber: string;
  lisansBitis: string | null;
  allowedIps: string | null;
  sirketAdi?: string | null;
}

export interface SetLicenseRequest {
  userId: string;
  lisansBitis: string;
}

export interface UpdateUserRequest {
  userId: string;
  userName: string;
  name: string;
  phoneNumber: string;
  sirketAdi?: string | null;
}

export interface CreateUserRequest {
  name: string;
  userName: string;
  password: string;
  phoneNumber: string;
  sirketAdi?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<IDataResult<AdminUser[]>> {
    return this.http.get<IDataResult<AdminUser[]>>(`${this.apiUrl}/users`);
  }

  setLicense(req: SetLicenseRequest): Observable<IResult> {
    return this.http.post<IResult>(`${this.apiUrl}/set-license`, req);
  }

  deleteUser(id: string): Observable<IResult> {
    return this.http.delete<IResult>(`${this.apiUrl}/delete-user/${id}`);
  }

  resetPassword(userId: string, newPassword: string): Observable<IResult> {
    return this.http.post<IResult>(`${this.apiUrl}/reset-password`, { userId, newPassword });
  }

  updateUser(req: UpdateUserRequest): Observable<IResult> {
    return this.http.put<IResult>(`${this.apiUrl}/update-user`, req);
  }

  createUser(req: CreateUserRequest): Observable<IResult> {
    return this.http.post<IResult>(`${this.apiUrl}/create-user`, req);
  }
}
