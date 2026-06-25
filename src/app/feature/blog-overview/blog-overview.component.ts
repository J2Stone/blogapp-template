import { Component, inject } from '@angular/core';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { Blog } from '../../interfaces/blog';
import { BlogService } from '../../shared/blog.service';

@Component({
  selector: 'app-blog-overview',
  standalone: true,
  imports: [BlogCardComponent],
  templateUrl: './blog-overview.component.html',
  styleUrl: './blog-overview.component.scss',
})
export class BlogOverviewComponent {
  private blogService = inject(BlogService);
  blogs: Blog[] = this.blogService.getAll();

  onLikeToggled(blogId: number): void {
    for (const blog of this.blogs) {
      if (blog.id === blogId) {
        blog.likedByMe = !blog.likedByMe;
        if (blog.likedByMe) {
          blog.likes++;
        } else {
          blog.likes--;
        }
      }
    }
  }
}
