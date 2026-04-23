import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page';
import { CategoryComponent } from './components/category/category';
import { SemptomComponent } from './components/semptom/semptom';
import { UrunDetayComponent } from './components/urun-detay/urun-detay';
import { BarkodComponent } from './components/barkod/barkod';
import { LoginComponent } from './components/login/login';
import { AdminPanelComponent } from './components/admin-panel/admin-panel';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'anasayfa', component: MainPageComponent, canActivate: [authGuard] },
  { path: 'urunler/:id', component: UrunDetayComponent, canActivate: [authGuard] },
  { path: 'kategoriler', component: CategoryComponent, canActivate: [authGuard] },
  { path: 'semptomlar', component: SemptomComponent, canActivate: [authGuard] },
  { path: 'barkod', component: BarkodComponent, canActivate: [authGuard] },
  { path: 'admin-panel', component: AdminPanelComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
