import { Injectable } from '@angular/core';
import { Blog } from '../interfaces/blog';
import blogData from '../data/blogs.json';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private blogs: Blog[] = blogData as Blog[];

  getAll(): Blog[] {
    return this.blogs;
  }

  getById(id: number): Blog | undefined {
    for (const blog of this.blogs) {
      if (blog.id === id) {
        return blog;
      }
    }
    return undefined;
  }
}
