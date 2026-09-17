import { Routes } from '@angular/router';
import { BlogDetailComponent } from './blog-detail.component';
import { blogResolver } from '../../shared/blog.resolver';

/**
 * Eigene Routes-Datei, damit der blogResolver erst beim Navigieren geladen wird:
 * er haengt ueber BlogService am zod-Schema, und das gehoert nicht ins Initial-Bundle.
 */
export const routes: Routes = [
  {
    path: '',
    component: BlogDetailComponent,
    resolve: { blog: blogResolver },
  },
];
