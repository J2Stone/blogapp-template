import { Blog } from '../../interfaces/blog';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog-card',
  imports: [MatCardModule, MatButtonModule, MatIconButton, MatIconModule, RouterLink],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.scss',
})
export class BlogCardComponent {
  blog = input.required<Blog>();
  likeToggled = output<number>();
}
