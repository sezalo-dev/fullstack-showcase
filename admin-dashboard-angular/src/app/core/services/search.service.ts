import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  triggerReindex(): Observable<{ indexed: number; errors: number }> {
    return of({ indexed: 0, errors: 0 });
  }
}
