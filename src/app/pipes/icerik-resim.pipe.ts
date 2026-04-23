import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'icerikResim',
  standalone: true,
})
export class IcerikResimPipe implements PipeTransform {
  transform(yol: string | null | undefined): string {
    if (!yol) {
      return 'placeholder.png';
    }
    return `${environment.apiUrl}${yol}`;
  }
}
