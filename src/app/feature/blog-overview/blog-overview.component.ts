import { Component } from '@angular/core';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { Blog } from '../../interfaces/blog';
import blogData from '../../data/blogs.json';

@Component({
  selector: 'app-blog-overview',
  standalone: true,
  imports: [BlogCardComponent],
  templateUrl: './blog-overview.component.html',
})
export class BlogOverviewComponent {
  blogs: Blog[] = blogData as Blog[];

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
