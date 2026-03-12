import { Routes } from '@angular/router';
import { authOnlyGuard } from './core/guards/auth-only.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login-page/login-page.component').then((m) => m.LoginPageComponent),
      },
      {
        path: 'change-password',
        canActivate: [authOnlyGuard],
        loadComponent: () =>
          import('./features/auth/change-password-page/change-password-page.component').then(
            (m) => m.ChangePasswordPageComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/metrics/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users-page/users-page.component').then((m) => m.UsersPageComponent),
      },
      {
        path: 'ads',
        loadComponent: () => import('./features/ads/ads-page/ads-page.component').then((m) => m.AdsPageComponent),
      },
      {
        path: 'messaging',
        loadComponent: () =>
          import('./features/messaging/messaging-page/messaging-page.component').then(
            (m) => m.MessagingPageComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/auth/settings-page/settings-page.component').then((m) => m.SettingsPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
