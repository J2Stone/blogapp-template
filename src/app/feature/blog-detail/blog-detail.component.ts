import { Component, input } from '@angular/core';
import { BlogDetail } from '../../interfaces/blog.schema';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [MatCardModule, DatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent {
  blog = input.required<BlogDetail | undefined>();
}
