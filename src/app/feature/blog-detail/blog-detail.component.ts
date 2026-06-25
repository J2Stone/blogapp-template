import { Component, input } from '@angular/core';
import { Blog } from '../../interfaces/blog';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent {
  blog = input.required<Blog | undefined>();
}
