import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Blog, BlogDetail, NewBlog, blogListResponseSchema } from '../interfaces/blog.schema';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  // In der Entwicklung ist apiUrl der BFF-Proxy, der den Bearer Token serverseitig
  // anhaengt; in Production zeigt er direkt aufs Backend (dort gibt es keinen BFF).
  private readonly url = `${environment.apiUrl}/entries`;

  async getBlogs(): Promise<Blog[]> {
    const response = await firstValueFrom(this.http.get(this.url));
    const result = blogListResponseSchema.safeParse(response);

    if (!result.success) {
      console.error('Unerwartete API-Antwort:', result.error.issues);
      throw new Error('Unerwartete API-Antwort');
    }

    return result.data.data;
  }

  async getById(id: number): Promise<BlogDetail | undefined> {
    try {
      return await firstValueFrom(this.http.get<BlogDetail>(`${this.url}/${id}`));
    } catch (error) {
      console.error(`Blog ${id} konnte nicht geladen werden:`, error);
      return undefined;
    }
  }

  async createBlog(blog: NewBlog): Promise<Blog | null> {
    try {
      return await firstValueFrom(this.http.post<Blog>(this.url, blog));
    } catch (error) {
      console.error('Blog konnte nicht erstellt werden:', error);
      return null;
    }
  }

  async updateBlog(id: number, blog: Partial<Blog>): Promise<Blog | null> {
    try {
      return await firstValueFrom(this.http.patch<Blog>(`${this.url}/${id}`, blog));
    } catch (error) {
      console.error(`Blog ${id} konnte nicht aktualisiert werden:`, error);
      return null;
    }
  }

  async deleteBlog(id: number): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
      return true;
    } catch (error) {
      console.error(`Blog ${id} konnte nicht gelöscht werden:`, error);
      return false;
    }
  }
}
