import { Routes } from '@angular/router';
import { BlogOverviewComponent } from './feature/blog-overview/blog-overview.component';
import { blogResolver } from './shared/blog.resolver';

export const routes: Routes = [
  { path: '', component: BlogOverviewComponent },
  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./feature/blog-detail/blog-detail.component').then((m) => m.BlogDetailComponent),
    resolve: { blog: blogResolver },
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
