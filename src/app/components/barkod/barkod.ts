import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { UrunService } from '../../services/urun.service';

@Component({
  selector: 'app-barkod',
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './barkod.html',
  styleUrl: './barkod.css',
})
export class BarkodComponent implements AfterViewInit {
  @ViewChild('barkodInput') barkodInputRef!: ElementRef<HTMLInputElement>;

  barkod = '';
  araniyor = false;
  hata: string | null = null;

  constructor(private urunService: UrunService, private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.barkodInputRef?.nativeElement.focus(), 100);
  }

  onBarkodGiris(): void {
    // Sadece rakam al, 13 haneden fazlasını kes
    this.barkod = this.barkod.replace(/\D/g, '').slice(0, 13);
    this.hata = null;

    if (this.barkod.length === 13) {
      this.ara();
    }
  }

  ara(): void {
    if (this.araniyor) return;
    this.araniyor = true;
    this.hata = null;

    this.urunService.getByBarcode(this.barkod).subscribe({
      next: (res) => {
        this.router.navigate(['/urunler', res.data.id]);
      },
      error: () => {
        this.hata = `"${this.barkod}" barkoduna sahip ürün bulunamadı.`;
        this.araniyor = false;
        this.barkod = '';
        setTimeout(() => this.barkodInputRef?.nativeElement.focus(), 50);
      }
    });
  }
}
