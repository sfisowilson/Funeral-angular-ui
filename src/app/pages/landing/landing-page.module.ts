import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { LandingPageComponent } from './landing-page.component';
import { HeroWidgetComponent } from '@app/building-blocks/hero-widget/hero-widget.component';
import { HeroEditorComponent } from '@app/building-blocks/hero-widget/hero-editor.component';
import { FeaturesWidgetComponent } from '@app/building-blocks/features-widget/features-widget.component';
import { FeaturesEditorComponent } from '@app/building-blocks/features-widget/features-editor.component';
import { CtaWidgetComponent } from '@app/building-blocks/cta-widget/cta-widget.component';
import { CtaEditorComponent } from '@app/building-blocks/cta-widget/cta-editor.component';
import { GalleryWidgetComponent } from '@app/building-blocks/gallery-widget/gallery-widget.component';
import { GalleryEditorComponent } from '@app/building-blocks/gallery-widget/gallery-editor.component';
import { WidgetWrapperComponent } from '@app/building-blocks/widget-wrapper/widget-wrapper.component';
import { PremiumCalculatorWidgetComponent } from '@app/building-blocks/premium-calculator-widget/premium-calculator-widget.component';
import { PremiumCalculatorEditorComponent } from '@app/building-blocks/premium-calculator-widget/premium-calculator-editor.component';

const routes: Routes = [{ path: '', component: LandingPageComponent }];

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        DragDropModule,
        RouterModule.forChild(routes),
        LandingPageComponent,
        HeroWidgetComponent,
        HeroEditorComponent,
        FeaturesWidgetComponent,
        FeaturesEditorComponent,
        CtaWidgetComponent,
        CtaEditorComponent,
        GalleryWidgetComponent,
        GalleryEditorComponent,
        WidgetWrapperComponent,
        PremiumCalculatorWidgetComponent,
        PremiumCalculatorEditorComponent
    ]
})
export class LandingPageModule {}
