import { Routes } from '@angular/router';
import { authGuard } from './shared/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/blog-overview/blog-overview.component').then(
        (m) => m.BlogOverviewComponent,
      ),
  },
  {
    path: 'blog/:id',
    loadChildren: () => import('./feature/blog-detail/blog-detail.routes').then((m) => m.routes),
  },
  {
    // canMatch statt canActivate: ohne Anmeldung wird der Lazy-Chunk gar nicht geladen.
    path: 'add-blog',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./feature/add-blog/add-blog.component').then((m) => m.AddBlogComponent),
  },
  {
    path: 'blog-create',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./feature/blog-create/blog-create.component').then((m) => m.BlogCreateComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./feature/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./feature/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./feature/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
