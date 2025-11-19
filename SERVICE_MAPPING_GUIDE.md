# Migration Service Mapper

This tool helps you map your NSwag services to Orval services.

## How to Use

After running `npm run generate:api`, run this to create a mapping:

```bash
node create-service-mapping.js
```

This will output a markdown file showing the correspondence between old and new services.

## Manual Mapping

Check your generated services and create mappings:

### Example Mapping

**NSwag Service:** `MemberServiceProxy`
**File:** `service-proxies.ts`
**Methods:**
- `member_GetAll(): Observable<MemberDto[]>`
- `member_GetById(id: number): Observable<MemberDto>`
- `member_Create(dto: MemberDto): Observable<void>`

**Orval Service:** `MemberService`
**File:** `services/generated/member.service.ts`
**Methods:**
- `apiMemberMemberGetAllGet(): Observable<MemberDto[]>`
- `apiMemberMemberGetByIdGet(params: { id: number }): Observable<MemberDto>`
- `apiMemberMemberCreatePost(params: { body: MemberDto }): Observable<void>`

### Key Differences

1. **Service naming:**
   - NSwag: `{Controller}ServiceProxy`
   - Orval: `{Tag}Service`

2. **Method naming:**
   - NSwag: Usually `{controller}_{action}`
   - Orval: Based on path + HTTP method (e.g., `api{Path}{Method}`)

3. **Parameters:**
   - NSwag: Individual parameters
   - Orval: Often wrapped in params object

4. **Imports:**
   - NSwag: Everything from `service-proxies.ts`
   - Orval: Services from `generated/`, models from `models/`

## Import Cheat Sheet

### NSwag (Old)
```typescript
import { 
  MemberServiceProxy, 
  MemberDto,
  PolicyServiceProxy,
  PolicyDto 
} from './core/services/service-proxies';

constructor(private memberService: MemberServiceProxy) {}
```

### Orval (New)
```typescript
import { MemberService, PolicyService } from './core/services/generated';
import { MemberDto, PolicyDto } from './core/models';
import { inject } from '@angular/core';

private memberService = inject(MemberService);
```

## Creating Your Own Mapping

1. Open `service-proxies.ts`
2. List all `@Injectable()` classes (these are your services)
3. For each service:
   - Find corresponding file in `services/generated/`
   - Map method names
   - Note parameter differences

Example template:

```markdown
## [ServiceName]Service

| NSwag Method | Orval Method | Parameter Change | Notes |
|--------------|--------------|------------------|-------|
| member_GetAll() | apiMemberMemberGetAllGet() | None | Same return type |
| member_GetById(id) | apiMemberMemberGetByIdGet({id}) | Wrapped in object | |
| member_Create(dto) | apiMemberMemberCreatePost({body: dto}) | Wrapped as body | |
```

## Find & Replace Patterns

After mapping, you can use these patterns:

### 1. Import Statements
```typescript
// Find:
from './core/services/service-proxies'

// Replace:
from './core/services/generated'
```

### 2. Model Imports  
```typescript
// Find:
import { MemberDto, PolicyDto } from './core/services/service-proxies';

// Replace:
import { MemberDto, PolicyDto } from './core/models';
```

### 3. Service Class Names
```typescript
// Find each: 
MemberServiceProxy
PolicyServiceProxy
ClaimServiceProxy
// etc...

// Replace with:
MemberService
PolicyService  
ClaimService
// etc...
```

### 4. Constructor to inject()
```typescript
// Find pattern:
constructor(
  private memberService: MemberServiceProxy,
  private policyService: PolicyServiceProxy
) {}

// Replace with:
private memberService = inject(MemberService);
private policyService = inject(PolicyService);
```

## Script to Find All Services

Run this in your Frontend directory to list all components using NSwag:

```powershell
Get-ChildItem -Recurse -Filter "*.component.ts" | 
  Select-String "ServiceProxy" | 
  Select-Object Path, LineNumber, Line | 
  Format-Table -AutoSize
```

## Verification Checklist

After replacing a service:

- [ ] Imports updated (service + models)
- [ ] Service injection updated (constructor → inject)
- [ ] Method calls updated (names may differ)
- [ ] Parameters updated (may be wrapped in objects)
- [ ] TypeScript compiles without errors
- [ ] Component loads in browser
- [ ] API calls work correctly
- [ ] No console errors
- [ ] Data displays as expected

## Example Migration

Here's a complete before/after example:

### Before (NSwag)
```typescript
// member-list.component.ts
import { Component } from '@angular/core';
import { MemberServiceProxy, MemberDto } from '../../core/services/service-proxies';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html'
})
export class MemberListComponent {
  members: MemberDto[] = [];
  
  constructor(private memberService: MemberServiceProxy) {}
  
  ngOnInit() {
    this.loadMembers();
  }
  
  loadMembers() {
    this.memberService.member_GetAll().subscribe({
      next: (data) => {
        this.members = data;
      },
      error: (error) => {
        console.error('Failed to load members', error);
      }
    });
  }
  
  loadMember(id: number) {
    this.memberService.member_GetById(id).subscribe({
      next: (member) => {
        console.log('Member loaded:', member);
      }
    });
  }
}
```

### After (Orval)
```typescript
// member-list.component.ts
import { Component, inject } from '@angular/core';
import { MemberService } from '../../core/services/generated';
import { MemberDto } from '../../core/models';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html'
})
export class MemberListComponent {
  members: MemberDto[] = [];
  private memberService = inject(MemberService);
  
  ngOnInit() {
    this.loadMembers();
  }
  
  loadMembers() {
    this.memberService.apiMemberMemberGetAllGet().subscribe({
      next: (data) => {
        this.members = data;
      },
      error: (error) => {
        console.error('Failed to load members', error);
      }
    });
  }
  
  loadMember(id: number) {
    this.memberService.apiMemberMemberGetByIdGet({ id }).subscribe({
      next: (member) => {
        console.log('Member loaded:', member);
      }
    });
  }
}
```

### Key Changes:
1. ✅ Import from `generated` and `models` instead of `service-proxies`
2. ✅ Added `inject` to imports
3. ✅ Changed from constructor injection to `inject()`
4. ✅ Updated method names (`member_GetAll` → `apiMemberMemberGetAllGet`)
5. ✅ Wrapped parameters in object (`id` → `{ id }`)

## Pro Tips

1. **Start simple:** Choose a component with only read operations (no create/update/delete)
2. **Compare methods:** Open both files side-by-side to see method names
3. **Use TypeScript:** Let the compiler find issues for you
4. **Test incrementally:** Test each component after migration
5. **Keep notes:** Document any tricky method name mappings
6. **Git commits:** Commit after each successful module migration

## Need Help?

See these files:
- `SERVICE_PROXIES_REPLACEMENT_STRATEGY.md` - Overall strategy
- `Frontend/NSWAG_TO_ORVAL_MIGRATION.md` - Detailed migration guide
- `Frontend/ORVAL_IMPLEMENTATION_GUIDE.md` - Usage examples
