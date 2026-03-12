import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Admin Login Placeholder</mat-card-title>
      <mat-card-content>
        Der produktive Login-Flow ist in der oeffentlichen Repository-Version nicht enthalten.
      </mat-card-content>
    </mat-card>
  `,
})
export class LoginPageComponent {}
