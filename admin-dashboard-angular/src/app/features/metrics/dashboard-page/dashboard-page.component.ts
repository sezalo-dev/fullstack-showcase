import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Dashboard Placeholder</mat-card-title>
      <mat-card-content>
        Diese Admin-Funktionalitaet wurde fuer die oeffentliche Repository-Version entfernt.
      </mat-card-content>
    </mat-card>
  `,
})
export class DashboardPageComponent {}
