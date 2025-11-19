# 🚀 Orval Quick Reference

## Generate API Clients

```bash
# Method 1: Using npm script
cd Frontend
npm run generate:api

# Method 2: Using batch file (includes validation)
cd Frontend
generate-api-clients.bat
```

## Prerequisites
✅ NodeAPI running on http://localhost:3000  
✅ Swagger available at http://localhost:3000/api-docs  
✅ Output directories exist (run `setup-orval-dirs.bat` first time)

## Import Examples

```typescript
// Services
import { MemberService, PolicyService } from './core/services/generated';

// Models
import { MemberDto, PolicyDto } from './core/models';

// Use in component
private memberService = inject(MemberService);
```

## Configuration

Edit `Frontend/orval.config.ts` to customize generation.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect to API | Start NodeAPI: `npm run start:dev` |
| Directories missing | Run `setup-orval-dirs.bat` |
| Type errors | Check OpenAPI spec in NodeAPI |
| Method not found | Verify operationId in swagger-jsdoc comments |

## Generated Files

```
Frontend/src/app/core/
├── models/              # All DTOs and types
└── services/generated/  # One service per API tag
```

## When to Regenerate

- ✅ New API endpoint added
- ✅ Changed request/response DTO
- ✅ Modified route parameters
- ❌ Only changed component code
- ❌ Only styling updates

## Useful Links

- Full Guide: `Frontend/ORVAL_IMPLEMENTATION_GUIDE.md`
- Migration: `Frontend/NSWAG_TO_ORVAL_MIGRATION.md`
- Orval Docs: https://orval.dev/
