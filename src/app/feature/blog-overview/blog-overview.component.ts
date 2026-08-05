import { Component, inject, OnInit, signal } from '@angular/core';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { Blog } from '../../interfaces/blog.schema';
import { BlogService } from '../../shared/blog.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-blog-overview',
  standalone: true,
  imports: [BlogCardComponent, MatProgressSpinnerModule],
  templateUrl: './blog-overview.component.html',
  styleUrl: './blog-overview.component.scss',
})
export class BlogOverviewComponent implements OnInit {
  private blogService = inject(BlogService);
  blogs = signal<Blog[]>([]);
  loading = signal(false);

  onLikeToggled(blogId: number): void {
    this.blogs.update((blogs) =>
      blogs.map((blog) => {
        if (blog.id !== blogId) {
          return blog;
        }
        return {
          ...blog,
          likedByMe: !blog.likedByMe,
          likes: blog.likedByMe ? blog.likes - 1 : blog.likes + 1,
        };
      }),
    );
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.blogs.set(await this.blogService.getBlogs());
    } finally {
      this.loading.set(false);
    }
  }
}
