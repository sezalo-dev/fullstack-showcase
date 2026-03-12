import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Password Change Placeholder</mat-card-title>
      <mat-card-content>
        Diese Auth-Funktion wurde in der Public-Version entfernt.
      </mat-card-content>
    </mat-card>
  `,
})
export class ChangePasswordPageComponent {}
