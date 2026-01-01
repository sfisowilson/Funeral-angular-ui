import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgoServiceProxy, NgoEvent } from '../../../../core/services/service-proxies';

@Component({
  selector: 'app-ngo-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './ngo-events.component.html',
  styleUrl: './ngo-events.component.scss'
})
export class NgoEventsComponent implements OnInit {
  ngoEvents: any[] = [];
  loading: boolean = false;
  selectedEvent: any = null;
  displayDialog: boolean = false;
  isEdit: boolean = false;
  eventForm: FormGroup;
  
  categoryOptions = [
    { label: 'Fundraising', value: 'Fundraising' },
    { label: 'Educational', value: 'Educational' },
    { label: 'Community Service', value: 'Community Service' },
    { label: 'Awareness Campaign', value: 'Awareness Campaign' },
    { label: 'Volunteer', value: 'Volunteer' },
    { label: 'Cultural', value: 'Cultural' },
    { label: 'Sports', value: 'Sports' },
    { label: 'Religious', value: 'Religious' }
  ];

  statusOptions = [
    { label: 'Upcoming', value: 'Upcoming' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      location: ['', Validators.required],
      category: ['', Validators.required],
      maxAttendees: [0, Validators.required, Validators.min(1)],
      currentAttendees: [0, Validators.min(0)],
      registrationRequired: [true],
      registrationDeadline: [''],
      imageUrl: [''],
      status: ['Upcoming', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadNgoEvents();
  }

  loadNgoEvents(): void {
    this.loading = true;
    this.ngoService.getNgoEvents().subscribe({
      next: (data: any) => {
        this.ngoEvents = data || [];
        this.loading = false;
      },
      error: (error) => {
        alert('Failed to load NGO events');
        this.loading = false;
      }
    });
  }

  openNewDialog(): void {
    this.selectedEvent = {};
    this.selectedEvent.startDate = new Date();
    this.selectedEvent.endDate = new Date();
    this.isEdit = false;
    this.displayDialog = true;
    this.eventForm.reset();
  }

  openEditDialog(event: any): void {
    this.selectedEvent = { ...event };
    this.isEdit = true;
    this.displayDialog = true;
    this.eventForm.patchValue(this.selectedEvent);
  }

  saveEvent(): void {
    if (this.eventForm.invalid) {
      alert('Please fill in all required fields');
      return;
    }

    this.loading = true;
    const formData = this.eventForm.value as NgoEvent;
    
    if (this.isEdit && this.selectedEvent.id) {
      this.ngoService.updateNgoEvent(this.selectedEvent.id, formData).subscribe({
        next: () => {
          alert('NGO event updated successfully');
          this.loadNgoEvents();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to update NGO event');
          this.loading = false;
        }
      });
    } else {
      this.ngoService.createNgoEvent(formData).subscribe({
        next: () => {
          alert('NGO event created successfully');
          this.loadNgoEvents();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to create NGO event');
          this.loading = false;
        }
      });
    }
  }

  deleteEvent(event: any): void {
    if (confirm(`Are you sure you want to delete the NGO event "${event.title}"?`)) {
      this.ngoService.deleteNgoEvent(event.id).subscribe({
        next: () => {
          alert('NGO event deleted successfully');
          this.loadNgoEvents();
        },
        error: (error) => {
          alert('Failed to delete NGO event');
        }
      });
    }
  }

  closeDialog(): void {
    this.displayDialog = false;
    this.selectedEvent = null;
    this.eventForm.reset();
  }

  viewEvent(event: any): void {
    // Open event details in a new tab or show more information
    // This could be a detail page or just display the event data
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'Upcoming':
        return 'info';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
