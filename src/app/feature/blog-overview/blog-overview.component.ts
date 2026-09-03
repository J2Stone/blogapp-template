import { Component, inject, OnInit } from '@angular/core';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { ALL_AUTHORS, BlogStateService } from '../../shared/blog-state.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-blog-overview',
  standalone: true,
  imports: [
    BlogCardComponent,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './blog-overview.component.html',
  styleUrl: './blog-overview.component.scss',
})
export class BlogOverviewComponent implements OnInit {
  protected readonly state = inject(BlogStateService);
  protected readonly allAuthors = ALL_AUTHORS;

  ngOnInit(): void {
    this.state.loadBlogs();
  }
}
