import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Login isteğine token ekleme
  if (req.url.includes('/api/Auth/login')) {
    return next(req);
  }

  const token = authService.getToken();

  if (token) {
    // Süresi dolmuş token'ı header'a ekleme
    const payload = authService.decodeToken();
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload && payload.exp < nowSec) {
      return next(req);
    }

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
