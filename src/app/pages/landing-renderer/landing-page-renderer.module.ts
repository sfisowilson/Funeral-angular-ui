import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingPageRendererComponent } from './landing-page-renderer.component';
import { HeroWidgetComponent } from '@app/building-blocks/hero-widget/hero-widget.component';
import { FeaturesWidgetComponent } from '@app/building-blocks/features-widget/features-widget.component';
import { CtaWidgetComponent } from '@app/building-blocks/cta-widget/cta-widget.component';
import { GalleryWidgetComponent } from '@app/building-blocks/gallery-widget/gallery-widget.component';
import { PremiumCalculatorWidgetComponent } from '@app/building-blocks/premium-calculator-widget/premium-calculator-widget.component';
import { ImageContentWidgetComponent } from '@app/building-blocks/image-content-widget/image-content-widget.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: LandingPageRendererComponent }];

@NgModule({
    imports: [CommonModule, RouterModule.forChild(routes), LandingPageRendererComponent, HeroWidgetComponent, FeaturesWidgetComponent, CtaWidgetComponent, GalleryWidgetComponent, PremiumCalculatorWidgetComponent, ImageContentWidgetComponent]
})
export class LandingPageRendererModule {}
