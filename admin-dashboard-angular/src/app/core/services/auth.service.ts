import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticated = signal<boolean>(true);

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  get requiresPasswordChange(): boolean {
    return false;
  }

  async login(): Promise<boolean> {
    this.authenticated.set(true);
    return true;
  }

  getLoginError(): string | null {
    return null;
  }

  async logout(): Promise<void> {
    this.authenticated.set(false);
  }

  getToken(): string | null {
    return null;
  }

  async changePassword(): Promise<boolean> {
    return true;
  }
}
