import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, MatCardModule],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card">
        <router-outlet></router-outlet>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
      }
      .auth-card {
        width: 400px;
        max-width: 95vw;
      }
    `,
  ],
})
export class AuthLayoutComponent {}

