import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BlogStateService } from './blog-state.service';
import { BlogService } from './blog.service';
import { Blog } from '../interfaces/blog.schema';

function makeBlog(id: number, author: string): Blog {
  return {
    id,
    title: `Blog ${id}`,
    author,
    likes: 1,
    likedByMe: false,
    createdByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contentPreview: 'Preview',
    comments: 0,
  };
}

describe('BlogStateService', () => {
  const blogs = [makeBlog(1, 'Ada'), makeBlog(2, 'Linus'), makeBlog(3, 'Ada')];
  let getBlogs: ReturnType<typeof vi.fn>;
  let service: BlogStateService;

  beforeEach(() => {
    localStorage.clear();
    getBlogs = vi.fn().mockResolvedValue(blogs);

    TestBed.configureTestingModule({
      providers: [{ provide: BlogService, useValue: { getBlogs } }],
    });
    service = TestBed.inject(BlogStateService);
  });

  it('starts empty and without error', () => {
    expect(service.blogs()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.selectedAuthor()).toBe('all');
  });

  it('fills the state on a successful load', async () => {
    await service.loadBlogs();

    expect(service.blogs()).toEqual(blogs);
    expect(service.blogCount()).toBe(3);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('sets an error message when loading fails', async () => {
    getBlogs.mockRejectedValue(new Error('offline'));

    await service.loadBlogs();

    expect(service.error()).toBe('Die Blog-Beiträge konnten nicht geladen werden.');
    expect(service.loading()).toBe(false);
  });

  it('derives the author list without duplicates', async () => {
    await service.loadBlogs();

    expect(service.authors()).toEqual(['Ada', 'Linus']);
  });

  it('filters the blogs by the selected author', async () => {
    await service.loadBlogs();
    service.setAuthor('Ada');

    expect(service.filteredBlogs().map((blog) => blog.id)).toEqual([1, 3]);

    service.setAuthor('all');
    expect(service.filteredBlogs()).toHaveLength(3);
  });

  it('persists the selected author in localStorage', () => {
    service.setAuthor('Linus');
    TestBed.tick(); // Effekte laufen erst beim nächsten Change-Detection-Lauf

    expect(localStorage.getItem('blog-selected-author')).toBe('Linus');
  });

  it('toggles the like state of a single blog', async () => {
    await service.loadBlogs();
    service.toggleLike(1);

    expect(service.blogs()[0]).toMatchObject({ likedByMe: true, likes: 2 });
    expect(service.blogs()[1]).toMatchObject({ likedByMe: false, likes: 1 });
  });
});
