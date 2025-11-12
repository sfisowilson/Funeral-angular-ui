# Funeral Management System - Angular Frontend

Modern, responsive Angular 19 web application for the Funeral Management System landing page builder with multi-tenant support.

## Overview

This is the frontend application for the Funeral Management System, featuring:
- **Landing Page Builder**: Drag-and-drop widget system for creating custom tenant landing pages
- **Dashboard Widgets**: Image content widgets with positioning, file upload, and styling controls
- **Multi-Tenant Support**: Subdomain-based tenant isolation (e.g., tenant.mizo.co.za)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Reactive forms with instant validation
- **File Management**: Image upload with progress tracking and preview

## Technology Stack

- **Framework**: Angular 19.0.6 (standalone components)
- **Package Manager**: npm
- **CSS Framework**: Tailwind CSS 3.x
- **UI Components**: PrimeNG 18.x
- **HTTP Client**: Angular HttpClient with interceptors
- **Build Tool**: Angular CLI 19.x
- **Language**: TypeScript 5.6+

## Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Angular CLI**: v19.0.0 or higher (install globally)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sfisowilson/Funeral-angular-ui.git
cd Funeral-angular-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `src/environments/environment.ts` and `src/environments/environment.prod.ts`:

**Development (`environment.ts`):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

**Production (`environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://mizo.co.za'
};
```

## Development

### Start Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you modify source files.

### Code Scaffolding

Generate new components:

```bash
ng generate component path/component-name
ng generate service path/service-name
ng generate directive name
ng generate pipe name
```

For more options:

```bash
ng generate --help
```

## Building

### Development Build

```bash
ng build
```

Output will be in `dist/funeral-angular-ui/`

### Production Build (Optimized)

```bash
ng build --configuration production
```

This includes:
- AOT (Ahead-of-Time) compilation
- Code minification
- Tree-shaking
- Bundle size optimization

## Project Structure

```
src/
├── app/
│   ├── auth/                          # Authentication module
│   │   ├── auth-service.ts
│   │   └── auth.interceptor.ts
│   ├── building-blocks/               # Reusable components and widgets
│   │   ├── image-content-widget/
│   │   │   ├── image-content-editor.component.ts
│   │   │   └── image-content-renderer.component.ts
│   │   └── [other-widgets]/
│   ├── core/                          # Core services
│   │   ├── services/
│   │   │   ├── tenant.service.ts
│   │   │   ├── api.service.ts
│   │   │   └── file-upload.service.ts
│   │   └── guards/
│   ├── pages/                         # Page components
│   │   ├── landing-page/
│   │   ├── admin-dashboard/
│   │   └── [other-pages]/
│   ├── app.component.ts               # Root component
│   ├── app.routes.ts                  # Route configuration
│   └── app.config.ts                  # Application configuration
├── assets/                            # Static assets
├── environments/                      # Environment configurations
├── styles/                            # Global styles
└── main.ts                            # Application entry point

tailwind.config.js                     # Tailwind CSS configuration
tsconfig.json                          # TypeScript configuration
angular.json                           # Angular CLI configuration
```

## Key Features

### Image Content Widget

The Image Content Widget allows users to:
- ✅ Upload images with 5MB size limit
- ✅ Position images (left, right, above, below)
- ✅ Configure text styling (title, subtitle, description)
- ✅ Add call-to-action buttons
- ✅ Customize colors and layout
- ✅ Real-time image preview
- ✅ Responsive sizing options

### Multi-Tenancy

- **Subdomain Detection**: Automatically identifies tenant from subdomain (e.g., `john.mizo.co.za`)
- **Tenant Scoping**: All requests include X-Tenant-ID header
- **Isolated Data**: Each tenant sees only their own content

### Authentication

- **JWT Bearer Tokens**: Secure token-based authentication
- **HTTP Interceptor**: Automatically adds Authorization header to requests
- **Token Storage**: Secure token persistence
- **Login/Logout**: User session management

## Development Commands

### Testing

```bash
ng test                          # Run unit tests
ng test --watch=false           # Single run
ng test --code-coverage         # Generate coverage report
```

### Linting

```bash
npm run lint                     # Run ESLint
npm run lint:fix                # Fix linting issues
```

### Code Quality

```bash
npm run format                   # Format code with Prettier
npm run format:check             # Check formatting without changes
```

## Production Deployment

### 1. Build Production Bundle

```bash
ng build --configuration production
```

### 2. Deploy to VPS

Copy dist files to the VPS:

```bash
scp -r dist/funeral-angular-ui/* root@102.211.206.197:/var/www/mizo-frontend/
```

### 3. Configure Nginx

Update Nginx configuration to serve Angular at root path:

```nginx
server {
    listen 443 ssl http2;
    server_name *.mizo.co.za mizo.co.za;
    
    ssl_certificate /etc/letsencrypt/live/mizo.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mizo.co.za/privkey.pem;
    
    # Serve Angular static files
    location / {
        root /var/www/mizo-frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to Node backend
    location /api/ {
        proxy_pass http://mizo_backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

### 4. Update Environment

Edit `src/environments/environment.prod.ts` with production API URL:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://mizo.co.za'
};
```

## Troubleshooting

### Port 4200 Already in Use

```bash
ng serve --port 4300   # Use different port
```

### Module Not Found

```bash
npm install             # Reinstall dependencies
npm cache clean --force # Clear npm cache
```

### CORS Issues

Ensure API server has CORS configured to allow your domain:

```
Access-Control-Allow-Origin: https://mizo.co.za
```

### Blank Page After Build

Ensure `try_files $uri $uri/ /index.html;` is in Nginx config to support client-side routing.

## Performance Optimization

- ✅ Lazy-loaded routes
- ✅ Tree-shaking for unused code removal
- ✅ Image optimization with WebP support
- ✅ CSS purging with Tailwind
- ✅ JavaScript minification
- ✅ Gzip compression via Nginx

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security

- ✅ JWT Bearer token authentication
- ✅ HttpOnly cookies for sensitive data
- ✅ CORS policies enforced
- ✅ Content Security Policy headers
- ✅ XSS protection via Angular sanitization

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## Deployment Checklist

- [ ] Environment variables configured (API URL)
- [ ] Production build tested locally
- [ ] Bundle size analyzed (`ng build --stats-json`)
- [ ] Performance audit passed
- [ ] Accessibility audit passed
- [ ] All unit tests passing
- [ ] Build artifacts deployed to VPS
- [ ] Nginx configuration updated
- [ ] SSL certificate configured
- [ ] API connectivity verified
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified

## License

ISC

## Support

For issues, questions, or contributions, visit:
https://github.com/sfisowilson/Funeral-angular-ui/issues

## Environment (Production)

- **Domain**: mizo.co.za with subdomain support (*.mizo.co.za)
- **Hosting**: Absolute Hosting VPS (102.211.206.197)
- **SSL**: Let's Encrypt (auto-renewing)
- **Reverse Proxy**: Nginx
- **API**: https://mizo.co.za
- **Node Version**: 20.x LTS

---

**Last Updated**: November 12, 2025
