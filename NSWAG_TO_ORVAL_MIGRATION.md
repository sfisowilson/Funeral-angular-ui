# NSwag to Orval Migration Guide

## Side-by-Side Comparison

### Service Generation

| Aspect | NSwag | Orval |
|--------|-------|-------|
| **Command** | `nswag run nswag.json` | `npm run generate:api` |
| **Config File** | `nswag.json` (227 lines) | `orval.config.ts` (20 lines) |
| **Input** | Local swagger.json file | HTTP endpoint or local file |
| **Output** | Single `service-proxies.ts` | Multiple files by tag |
| **Ecosystem** | .NET focused | Node.js/TypeScript native |

### Generated Code Structure

#### NSwag Output
```
src/app/core/services/
└── service-proxies.ts (single huge file with all services)
```

#### Orval Output
```
src/app/core/
├── models/                    # Separate model files
│   ├── index.ts
│   ├── memberDto.ts
│   ├── policyDto.ts
│   └── ...
└── services/generated/        # One service per tag
    ├── index.ts
    ├── member.service.ts
    ├── policy.service.ts
    └── ...
```

### Code Usage Examples

#### NSwag Style
```typescript
import { Component } from '@angular/core';
import { MemberServiceProxy, MemberDto } from './core/services/service-proxies';

@Component({
  selector: 'app-members',
  template: '...'
})
export class MembersComponent {
  constructor(private memberService: MemberServiceProxy) {}
  
  loadMembers() {
    this.memberService.member_GetAll().subscribe((members: MemberDto[]) => {
      console.log(members);
    });
  }
}
```

#### Orval Style
```typescript
import { Component, inject } from '@angular/core';
import { MemberService } from './core/services/generated';
import { MemberDto } from './core/models';

@Component({
  selector: 'app-members',
  template: '...'
})
export class MembersComponent {
  private memberService = inject(MemberService);
  
  loadMembers() {
    this.memberService.apiMemberMemberGetAllGet().subscribe((members: MemberDto[]) => {
      console.log(members);
    });
  }
}
```

### Key Differences

#### 1. Class Naming
- **NSwag**: `{Controller}ServiceProxy` (e.g., `MemberServiceProxy`)
- **Orval**: `{Tag}Service` (e.g., `MemberService`)

#### 2. Method Naming
- **NSwag**: Typically `{controller}_{action}()` (e.g., `member_GetAll()`)
- **Orval**: Based on operationId or path (e.g., `apiMemberMemberGetAllGet()`)

#### 3. Import Statements
```typescript
// NSwag - Everything from one file
import { 
  MemberServiceProxy, 
  MemberDto,
  PolicyServiceProxy,
  PolicyDto 
} from './services/service-proxies';

// Orval - Separate imports
import { MemberService, PolicyService } from './services/generated';
import { MemberDto, PolicyDto } from './models';
```

#### 4. Dependency Injection

```typescript
// NSwag - Constructor injection
constructor(
  private memberService: MemberServiceProxy,
  private policyService: PolicyServiceProxy
) {}

// Orval - Modern inject() function
private memberService = inject(MemberService);
private policyService = inject(PolicyService);
```

### Migration Checklist

#### Phase 1: Setup (One-time)
- [ ] Install Orval (already done via package.json)
- [ ] Create `orval.config.ts`
- [ ] Create output directories
- [ ] Add `generate:api` script to package.json
- [ ] Generate initial clients: `npm run generate:api`

#### Phase 2: Update Imports (File by file)
- [ ] Replace service imports
  ```typescript
  // Old
  import { MemberServiceProxy } from './core/services/service-proxies';
  
  // New
  import { MemberService } from './core/services/generated';
  ```
- [ ] Replace model imports
  ```typescript
  // Old
  import { MemberDto } from './core/services/service-proxies';
  
  // New
  import { MemberDto } from './core/models';
  ```

#### Phase 3: Update Service Usage
- [ ] Replace constructor injection with `inject()`
  ```typescript
  // Old
  constructor(private memberService: MemberServiceProxy) {}
  
  // New
  private memberService = inject(MemberService);
  ```
- [ ] Update method calls (method names may differ)
  ```typescript
  // Old
  this.memberService.member_GetAll()
  
  // New
  this.memberService.apiMemberMemberGetAllGet()
  ```

#### Phase 4: Testing
- [ ] Test each migrated component
- [ ] Verify API calls work correctly
- [ ] Check error handling
- [ ] Test with real API data

#### Phase 5: Cleanup
- [ ] Remove `nswag.json`
- [ ] Remove old `service-proxies.ts`
- [ ] Remove NSwag npm package (if installed)
- [ ] Update documentation

### Migration Strategy

#### Strategy 1: Big Bang (Not Recommended)
Replace everything at once. High risk, but fast if successful.

#### Strategy 2: Incremental (Recommended)
1. Keep both NSwag and Orval generated files temporarily
2. Migrate one module/feature at a time
3. Test thoroughly after each module
4. Remove NSwag files when all modules migrated

#### Strategy 3: Parallel Run
1. Generate both NSwag and Orval clients
2. Place Orval output in different directory
3. Gradually switch imports
4. No breaking changes during transition

### Common Issues & Solutions

#### Issue: Method names changed
**Solution**: Check the generated method names. Orval uses operationId from Swagger spec.

```typescript
// If your swagger has: operationId: "Member_GetAll"
// NSwag generates: member_GetAll()
// Orval generates: memberGetAll() or apiMemberGetAllGet()
```

#### Issue: Base URL not set
**Solution**: Set baseUrl in orval.config.ts or use environment.ts

```typescript
// orval.config.ts
output: {
  baseUrl: 'http://localhost:3000',
}
```

#### Issue: Authentication headers missing
**Solution**: Use custom-instance.ts to add interceptors

```typescript
// custom-instance.ts
const headers = new HttpHeaders({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
  ...config.headers,
});
```

#### Issue: Response types different
**Solution**: Check your OpenAPI schema definitions. Regenerate if needed.

### Testing the Migration

```typescript
// Create a simple test component
import { Component, inject } from '@angular/core';
import { MemberService } from './core/services/generated';

@Component({
  selector: 'app-test',
  template: '<pre>{{ result | json }}</pre>'
})
export class TestComponent {
  private memberService = inject(MemberService);
  result: any;
  
  ngOnInit() {
    // Test a simple GET call
    this.memberService.apiMemberMemberGetAllGet().subscribe({
      next: (data) => {
        console.log('✅ Success:', data);
        this.result = data;
      },
      error: (error: any) => {
        console.error('❌ Error:', error);
        this.result = { error: error.message };
      }
    });
  }
}
```

### Performance Comparison

| Metric | NSwag | Orval |
|--------|-------|-------|
| Generation Time | ~5-10s | ~2-5s |
| Output File Size | 1 large file | Multiple smaller files |
| Tree Shaking | Limited | Excellent |
| Build Time Impact | Higher | Lower |
| Hot Reload | Slower | Faster |

### Best Practices

1. **Regenerate often**: Run `npm run generate:api` after every API change
2. **Version control**: Commit generated files to track API changes
3. **CI/CD**: Add generation step to your build pipeline
4. **Documentation**: Keep swagger docs up-to-date for accurate generation
5. **Naming conventions**: Use consistent operationIds in your API

### When to Regenerate

✅ **Do regenerate when:**
- Adding new API endpoints
- Changing request/response DTOs
- Modifying path parameters or query params
- Updating API documentation
- Switching API versions

❌ **Don't need to regenerate when:**
- Changing component logic only
- Updating styles or templates
- Modifying business logic
- Database changes (unless affecting DTOs)

### Final Tips

- Keep `nswag.json` as backup until migration is complete
- Test in development environment first
- Update one service at a time in large applications
- Document any custom configurations
- Share the `ORVAL_IMPLEMENTATION_GUIDE.md` with your team

---

**Remember**: The goal is a smoother, faster, more maintainable API client generation process. Take your time with the migration!
