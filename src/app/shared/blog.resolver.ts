import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { BlogService } from './blog.service';
import { BlogDetail } from '../interfaces/blog.schema';

export const blogResolver: ResolveFn<BlogDetail | undefined> = (route) => {
  const blogService = inject(BlogService);
  const id = Number(route.paramMap.get('id'));
  return blogService.getById(id);
};
