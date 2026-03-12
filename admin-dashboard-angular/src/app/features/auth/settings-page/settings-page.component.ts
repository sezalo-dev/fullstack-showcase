import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Settings Placeholder</mat-card-title>
      <mat-card-content>
        Einstellungen und account-bezogene Admin-Logik sind in dieser Public-Version nur als Platzhalter sichtbar.
      </mat-card-content>
    </mat-card>
  `,
})
export class SettingsPageComponent {}
