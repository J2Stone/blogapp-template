import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BlogOverviewComponent } from './blog-overview.component';
import { BlogService } from '../../shared/blog.service';
import { BlogStateService } from '../../shared/blog-state.service';
import { Blog } from '../../interfaces/blog.schema';

const blogs: Blog[] = [
  {
    id: 1,
    title: 'Signals',
    author: 'Ada',
    likes: 3,
    likedByMe: false,
    createdByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contentPreview: 'Preview',
    comments: 0,
  },
];

describe('BlogOverviewComponent', () => {
  let component: BlogOverviewComponent;
  let fixture: ComponentFixture<BlogOverviewComponent>;
  let state: BlogStateService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [BlogOverviewComponent],
      providers: [
        provideRouter([]),
        { provide: BlogService, useValue: { getBlogs: vi.fn().mockResolvedValue(blogs) } },
      ],
    }).compileComponents();

    state = TestBed.inject(BlogStateService);
    fixture = TestBed.createComponent(BlogOverviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the blogs into the state service on init', () => {
    expect(state.blogs()).toEqual(blogs);
  });

  it('renders the blog count and the loaded card', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('1 Blog-Beiträge');
    expect(fixture.nativeElement.querySelectorAll('app-blog-card')).toHaveLength(1);
  });

  it('shows the error message when loading failed', async () => {
    state.setAuthor('all');
    TestBed.inject(BlogService).getBlogs = vi.fn().mockRejectedValue(new Error('offline'));

    await state.loadBlogs();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.error')?.textContent).toContain(
      'konnten nicht geladen werden',
    );
  });
});
