import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-messaging-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Messaging Placeholder</mat-card-title>
      <mat-card-content>
        Die Admin-Messaging-Funktion wurde fuer das oeffentliche Repository auf einen Platzhalter reduziert.
      </mat-card-content>
    </mat-card>
  `,
})
export class MessagingPageComponent {}
