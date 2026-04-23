import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Directive({
  selector: 'img[appHttpSrc]',
  standalone: true,
  host: {},
})
export class HttpSrcDirective implements OnChanges, OnDestroy {
  @Input({ required: false, alias: 'appHttpSrc' }) appHttpSrc: string | null | undefined = '';

  private http = inject(HttpClient);
  private el = inject(ElementRef<HTMLImageElement>);
  private objectUrl: string | null = null;

  ngOnChanges(): void {
    this.revoke();
    const src = this.appHttpSrc;
    if (!src || src === 'placeholder.png') {
      this.el.nativeElement.src = 'placeholder.png';
      return;
    }
    this.http.get(src, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.el.nativeElement.src = this.objectUrl;
      },
      error: () => {
        this.el.nativeElement.src = 'placeholder.png';
      },
    });
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  private revoke(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
