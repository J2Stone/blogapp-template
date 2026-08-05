import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogDetailComponent } from './blog-detail.component';
import { BlogDetail } from '../../interfaces/blog.schema';

const mockBlog: BlogDetail = {
  id: 1,
  title: 'Test',
  content: 'Voller Inhalt',
  author: 'Autor',
  likes: 0,
  comments: [],
  likedByMe: false,
  createdByMe: false,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

describe('BlogDetailComponent', () => {
  let component: BlogDetailComponent;
  let fixture: ComponentFixture<BlogDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('blog', mockBlog);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
