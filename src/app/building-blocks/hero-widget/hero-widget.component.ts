import { CommonModule } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-hero-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './hero-widget.component.html',
    styleUrl: './hero-widget.component.css'
})
export class HeroWidgetComponent {
    @Input() config!: WidgetConfig;
}
