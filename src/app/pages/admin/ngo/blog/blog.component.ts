import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { NgoBlogPost, NgoServiceProxy } from '../../../../core/services/service-proxies';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  posts: NgoBlogPost[] = [];
  displayDialog: boolean = false;
  blogForm!: FormGroup;
  selectedPost: NgoBlogPost | null = null;
  loading: boolean = false;
  isEditMode: boolean = false;

  statusOptions = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Published', value: 'Published' },
    { label: 'Archived', value: 'Archived' }
  ];

  categoryOptions = [
    { label: 'News', value: 'News' },
    { label: 'Events', value: 'Events' },
    { label: 'Success Stories', value: 'Success Stories' },
    { label: 'Announcements', value: 'Announcements' },
    { label: 'Community', value: 'Community' }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  initForm(): void {
    this.blogForm = this.fb.group({
      id: [0],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', Validators.required],
      excerpt: ['', Validators.maxLength(500)],
      author: ['', [Validators.required, Validators.maxLength(100)]],
      publishDate: [new Date(), Validators.required],
      category: ['', Validators.required],
      tags: [''],
      featuredImage: [''],
      status: ['Draft', Validators.required],
      viewCount: [0],
      seoTitle: ['', Validators.maxLength(70)],
      seoDescription: ['', Validators.maxLength(160)],
      createdAt: [DateTime.now()],
      updatedAt: [DateTime.now()]
    });
  }

  loadPosts(): void {
    this.loading = true;
    this.ngoService.getNgoBlogPosts().subscribe({
      next: (data: any) => {
        this.posts = data || [];
        this.loading = false;
      },
      error: (error) => {
        alert('Failed to load blog posts');
        this.loading = false;
      }
    });
  }

  openNew(): void {
    this.selectedPost = null;
    this.isEditMode = false;
    this.blogForm.reset({
      id: 0,
      status: 'Draft',
      viewCount: 0,
      publishDate: new Date(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now()
    });
    this.displayDialog = true;
  }

  editPost(post: NgoBlogPost): void {
    this.selectedPost = post;
    this.isEditMode = true;
    const isoDate = post.publishDate?.toISO();
    this.blogForm.patchValue({
      ...post,
      publishDate: isoDate ? new Date(isoDate) : new Date()
    });
    this.displayDialog = true;
  }

  savePost(): void {
    if (this.blogForm.valid) {
      this.loading = true;
      const formValue = this.blogForm.value;
      const post: NgoBlogPost = {
        ...formValue,
        publishDate: DateTime.fromJSDate(formValue.publishDate),
        updatedAt: DateTime.now()
      } as NgoBlogPost;

      if (this.isEditMode) {
        this.ngoService.updateNgoBlogPost(post.id, post).subscribe({
          next: () => {
            alert('Blog post updated successfully');
            this.loadPosts();
            this.displayDialog = false;
            this.loading = false;
          },
          error: () => {
            alert('Failed to update blog post');
            this.loading = false;
          }
        });
      } else {
        this.ngoService.createNgoBlogPost(post).subscribe({
          next: () => {
            alert('Blog post created successfully');
            this.loadPosts();
            this.displayDialog = false;
            this.loading = false;
          },
          error: () => {
            alert('Failed to create blog post');
            this.loading = false;
          }
        });
      }
    } else {
      alert('Please fill all required fields');
    }
  }

  deletePost(post: NgoBlogPost): void {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      this.loading = true;
      this.ngoService.deleteNgoBlogPost(post.id).subscribe({
        next: () => {
          alert('Blog post deleted successfully');
          this.loadPosts();
        },
        error: () => {
          alert('Failed to delete blog post');
          this.loading = false;
        }
      });
    }
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.blogForm.reset();
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Blog Post' : 'New Blog Post';
  }

  toDate(dateTime: any): Date | null {
    if (!dateTime) return null;
    if (dateTime.toJSDate) {
      return dateTime.toJSDate();
    }
    return dateTime;
  }
}
