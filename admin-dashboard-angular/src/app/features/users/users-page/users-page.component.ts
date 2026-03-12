import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Users Placeholder</mat-card-title>
      <mat-card-content>
        Benutzerverwaltung ist in der Public-Version nur als Platzhalter enthalten.
      </mat-card-content>
    </mat-card>
  `,
})
export class UsersPageComponent {}
