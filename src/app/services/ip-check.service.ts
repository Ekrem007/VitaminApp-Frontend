import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IpCheckService implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private sub: Subscription | null = null;

  start(): void {
    if (this.sub) return; // Zaten çalışıyor

    this.sub = interval(2 * 60 * 1000).pipe(
      switchMap(() =>
        this.authService.getAllowedIps().pipe(
          catchError(() => of(null)) // Ağ hatalarında logout yapma
        )
      )
    ).subscribe(res => {
      if (!res || !res.success) return;

      const tokenIp = this.authService.getIpFromToken();
      if (tokenIp && res.data !== tokenIp) {
        this.forceLogout();
      }
    });
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  private forceLogout(): void {
    this.stop();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
