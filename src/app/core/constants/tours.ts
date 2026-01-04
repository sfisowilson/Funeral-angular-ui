import { Tour } from '../services/tour.service';

export const PAGE_BUILDER_TOUR: Tour = {
  id: 'page-builder',
  name: 'Page Builder Tour',
  steps: [
    {
      target: '.page-builder-container',
      title: 'Welcome to the Page Builder! 🎨',
      content: 'This powerful editor lets you create beautiful pages without any coding. Let\'s take a quick tour!',
      position: 'bottom'
    },
    {
      target: '#add-widget-button',
      title: 'Add Widgets',
      content: 'Click here to browse our library of 60+ pre-built widgets. From hero sections to contact forms, pricing tables to testimonials - we have everything you need.',
      position: 'bottom',
      highlightPadding: 12
    },
    {
      target: '.widget-canvas',
      title: 'Your Canvas',
      content: 'This is where your magic happens! Widgets you add will appear here. You can drag to reorder them, click to edit, or delete what you don\'t need.',
      position: 'right'
    },
    {
      target: '.widget-item:first-child',
      title: 'Edit Widgets',
      content: 'Click the edit icon on any widget to customize its content, colors, spacing, and more. Changes save automatically!',
      position: 'left'
    },
    {
      target: '#page-settings-button',
      title: 'Page Settings',
      content: 'Configure SEO metadata, navigation visibility, permissions, and more. Make your page exactly how you want it.',
      position: 'bottom'
    },
    {
      target: '#preview-button',
      title: 'Preview Your Work',
      content: 'See how your page looks before publishing. Preview on desktop, tablet, and mobile views.',
      position: 'bottom'
    },
    {
      target: '#save-button',
      title: 'Save & Publish',
      content: 'Your changes auto-save as drafts. When ready, click here to publish your page live!',
      position: 'bottom',
      showSkip: false
    }
  ]
};

export const CUSTOM_PAGES_LIST_TOUR: Tour = {
  id: 'custom-pages-list',
  name: 'Custom Pages Overview',
  steps: [
    {
      target: '.pages-header',
      title: 'Manage Your Pages',
      content: 'This is your pages dashboard. See all your pages, create new ones, and manage what\'s visible to visitors.',
      position: 'bottom'
    },
    {
      target: '#create-page-button',
      title: 'Create Your First Page',
      content: 'Click here to start building! You can start from scratch or choose from our templates.',
      position: 'bottom',
      highlightPadding: 12
    },
    {
      target: '.page-list-item:first-child',
      title: 'Page Actions',
      content: 'Each page shows its status, visibility settings, and quick actions. Click edit to modify, or use the menu for more options.',
      position: 'left'
    },
    {
      target: '.navbar-toggle',
      title: 'Navigation Control',
      content: 'Toggle whether a page appears in your site navigation. You can also set the display order.',
      position: 'top'
    }
  ]
};

export const DASHBOARD_TOUR: Tour = {
  id: 'dashboard',
  name: 'Dashboard Tour',
  steps: [
    {
      target: '.dashboard-header',
      title: 'Welcome to Your Dashboard! 👋',
      content: 'This is your command center. Let\'s show you around so you can get started quickly.',
      position: 'bottom'
    },
    {
      target: '.quick-actions',
      title: 'Quick Actions',
      content: 'Jump right into common tasks: create pages, manage members, process payments, and more.',
      position: 'bottom'
    },
    {
      target: '.setup-progress',
      title: 'Setup Progress',
      content: 'Track your onboarding progress here. Complete these steps to get your site fully configured.',
      position: 'bottom'
    },
    {
      target: '.sidebar-nav',
      title: 'Main Navigation',
      content: 'Access all features from this menu. Pages, members, payments, settings - everything is organized here.',
      position: 'right'
    },
    {
      target: '.help-button',
      title: 'Need Help?',
      content: 'Click here anytime for tutorials, documentation, or to contact support. We\'re here to help!',
      position: 'left',
      showSkip: false
    }
  ]
};

export const WIDGET_LIBRARY_TOUR: Tour = {
  id: 'widget-library',
  name: 'Widget Library Tour',
  steps: [
    {
      target: '.widget-library-modal',
      title: 'Choose Your Widgets',
      content: 'Browse our collection of professional widgets. Each one is fully customizable to match your brand.',
      position: 'top'
    },
    {
      target: '.widget-category-tabs',
      title: 'Filter by Category',
      content: 'Widgets are organized by type: Layout, Content, Forms, Media, and more. Find what you need quickly!',
      position: 'bottom'
    },
    {
      target: '.widget-search',
      title: 'Search Widgets',
      content: 'Know what you\'re looking for? Use search to find it instantly.',
      position: 'bottom'
    },
    {
      target: '.widget-card:first-child',
      title: 'Preview & Add',
      content: 'Hover over any widget to see a preview. Click to add it to your page. That\'s it!',
      position: 'right',
      showSkip: false
    }
  ]
};

export const FIRST_TIME_USER_TOUR: Tour = {
  id: 'first-time-user',
  name: 'Getting Started',
  steps: [
    {
      target: 'body',
      title: 'Welcome to Mizo! 🎉',
      content: 'Let\'s get you started with a quick 2-minute tour. We\'ll show you the essentials so you can start building right away.',
      position: 'bottom'
    },
    {
      target: '#pages-menu-item',
      title: 'Pages',
      content: 'This is where you\'ll build your website. Create pages like Home, About Us, Contact, and more.',
      position: 'right',
      highlightPadding: 8
    },
    {
      target: '#settings-menu-item',
      title: 'Settings',
      content: 'Customize your branding, logo, colors, contact info, and more to make your site uniquely yours.',
      position: 'right',
      highlightPadding: 8
    },
    {
      target: '.user-menu',
      title: 'Your Account',
      content: 'Access your profile, billing, and account settings here.',
      position: 'bottom'
    },
    {
      target: '.help-button',
      title: 'We\'re Here to Help',
      content: 'Stuck? Click here for help docs, video tutorials, or live support chat. Ready to build something amazing?',
      position: 'left',
      showSkip: false
    }
  ]
};

// Helper function to get tour by ID
export function getTourById(id: string): Tour | undefined {
  const tours: { [key: string]: Tour } = {
    'page-builder': PAGE_BUILDER_TOUR,
    'custom-pages-list': CUSTOM_PAGES_LIST_TOUR,
    'dashboard': DASHBOARD_TOUR,
    'widget-library': WIDGET_LIBRARY_TOUR,
    'first-time-user': FIRST_TIME_USER_TOUR
  };
  return tours[id];
}
