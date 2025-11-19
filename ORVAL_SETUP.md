# Orval API Client Generation Guide

## Setup Complete ✅

Orval has been configured to replace NSwag for generating TypeScript API clients from your Node.js API.

## Configuration Files Created

1. **orval.config.ts** - Main Orval configuration
2. **src/app/core/services/custom-instance.ts** - Custom HTTP client wrapper with Angular HttpClient

## How to Generate API Clients

### 1. Start your Node.js API server
```bash
cd ..\NodeAPI
npm run start:dev
```

### 2. Generate the API clients (in Frontend directory)
```bash
npm run generate:api
```

This will:
- Read the OpenAPI spec from `http://localhost:3000/api-docs/swagger.json`
- Generate TypeScript models in `src/app/core/models/`
- Generate Angular services in `src/app/core/services/generated/`
- Services are split by tags for better organization
- Automatically format generated files with Prettier

## Generated Structure

```
src/app/core/
├── models/               # TypeScript interfaces/types
│   ├── index.ts
│   └── *.ts             # Model definitions
├── services/
│   ├── custom-instance.ts    # HTTP client wrapper
│   └── generated/
│       ├── index.ts
│       └── *.ts         # Service classes (one per tag)
```

## Usage in Components

```typescript
import { inject } from '@angular/core';
import { MemberService } from './core/services/generated';

export class MyComponent {
  private memberService = inject(MemberService);
  
  ngOnInit() {
    this.memberService.getMemberById({ id: 1 }).subscribe(member => {
      console.log(member);
    });
  }
}
```

## Benefits Over NSwag

- ✅ Native Node.js/TypeScript tooling
- ✅ Faster generation
- ✅ Better Angular integration
- ✅ Tag-based service splitting
- ✅ Modern Observable patterns
- ✅ Full TypeScript type safety

## Migration from NSwag

Your old service proxies were at: `app/core/services/service-proxies.ts`
New services will be in: `app/core/services/generated/`

Update your imports from:
```typescript
import { MemberServiceProxy } from './core/services/service-proxies';
```

To:
```typescript
import { MemberService } from './core/services/generated';
```

## Configuration Options

Edit `orval.config.ts` to customize:
- Output paths
- Client type (angular, axios, fetch, etc.)
- Mock generation
- Custom transformers
- And more...

## Troubleshooting

If generation fails:
1. Ensure NodeAPI is running on `http://localhost:3000`
2. Check that `/api-docs/swagger.json` is accessible
3. Verify your OpenAPI spec is valid
4. Check the console output for specific errors
