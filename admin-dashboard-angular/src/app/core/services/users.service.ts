import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersService {
  getUserCount(): Observable<number> {
    return of(0);
  }

  getUsers(): Observable<{ items: Array<{ email: string; name?: string; status: string; createdAt: string }>; count: number }> {
    return of({ items: [], count: 0 });
  }
}
