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

  it('is loading while the request runs and stops afterwards', async () => {
    const pending = service.loadBlogs();
    expect(service.loading()).toBe(true);

    await pending;
    expect(service.loading()).toBe(false);
  });

  it('recomputes blogCount when the source changes', async () => {
    await service.loadBlogs();
    expect(service.blogCount()).toBe(3);

    getBlogs.mockResolvedValue([]);
    await service.loadBlogs();
    expect(service.blogCount()).toBe(0);
  });

  it('calls localStorage.setItem from the effect', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    service.setAuthor('Ada');
    TestBed.tick();

    expect(setItem).toHaveBeenCalledWith('blog-selected-author', 'Ada');
    setItem.mockRestore();
  });

  it('handles an empty list from the backend', async () => {
    getBlogs.mockResolvedValue([]);
    await service.loadBlogs();

    expect(service.blogCount()).toBe(0);
    expect(service.authors()).toEqual([]);
    expect(service.filteredBlogs()).toEqual([]);
  });

  it('keeps an empty list when the backend returns null (BlogService rejects it)', async () => {
    // BlogService validiert die Antwort per zod und wirft bei null/undefined.
    getBlogs.mockRejectedValue(new Error('Unerwartete API-Antwort'));
    await service.loadBlogs();

    expect(service.blogs()).toEqual([]);
    expect(service.blogCount()).toBe(0);
    expect(service.error()).not.toBeNull();
  });

  it('returns no blogs for an unknown author', async () => {
    await service.loadBlogs();
    service.setAuthor('Unbekannt');

    expect(service.filteredBlogs()).toEqual([]);
  });

  it('toggles the like state of a single blog', async () => {
    await service.loadBlogs();
    service.toggleLike(1);

    expect(service.blogs()[0]).toMatchObject({ likedByMe: true, likes: 2 });
    expect(service.blogs()[1]).toMatchObject({ likedByMe: false, likes: 1 });
  });
});
