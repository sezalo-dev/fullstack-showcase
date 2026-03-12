import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-ads-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Anzeigen Placeholder</mat-card-title>
      <mat-card-content>
        Die interne Anzeigenverwaltung wurde in dieser oeffentlichen Version entfernt.
      </mat-card-content>
    </mat-card>
  `,
})
export class AdsPageComponent {}
