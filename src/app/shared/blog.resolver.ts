import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { BlogService } from './blog.service';
import { Blog } from '../interfaces/blog';

export const blogResolver: ResolveFn<Blog | undefined> = (route) => {
  const blogService = inject(BlogService);
  const id = Number(route.paramMap.get('id'));
  return blogService.getById(id);
};
