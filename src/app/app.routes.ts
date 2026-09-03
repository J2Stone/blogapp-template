import { Routes } from '@angular/router';
import { BlogOverviewComponent } from './feature/blog-overview/blog-overview.component';
import { blogResolver } from './shared/blog.resolver';
import { authGuard } from './shared/auth.guard';

export const routes: Routes = [
  { path: '', component: BlogOverviewComponent },
  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./feature/blog-detail/blog-detail.component').then((m) => m.BlogDetailComponent),
    resolve: { blog: blogResolver },
  },
  {
    // canMatch statt canActivate: ohne Anmeldung wird der Lazy-Chunk gar nicht geladen.
    path: 'add-blog',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./feature/add-blog/add-blog.component').then((m) => m.AddBlogComponent),
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
