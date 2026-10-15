import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogCardComponent } from './blog-card.component';
import { Blog } from '../../interfaces/blog.schema';
import { provideRouter } from '@angular/router';

const mockBlog: Blog = {
  id: 1,
  title: 'Test',
  contentPreview: 'Preview',
  author: 'Autor',
  likes: 0,
  comments: 0,
  likedByMe: false,
  createdByMe: false,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

describe('BlogCardComponent', () => {
  let component: BlogCardComponent;
  let fixture: ComponentFixture<BlogCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('blog', mockBlog);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the blog title', () => {
    const title = fixture.nativeElement.querySelector('mat-card-title');
    expect(title.textContent).toContain('Test');
  });

  it('should emit the blog id when the like button is clicked', () => {
    const emitted: number[] = [];
    component.likeToggled.subscribe((id) => emitted.push(id));

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toEqual([1]);
  });
});
