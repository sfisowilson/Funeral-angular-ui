import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components globally for PrimeNG charts
Chart.register(...registerables);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
