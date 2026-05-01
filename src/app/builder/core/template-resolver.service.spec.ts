import { TestBed } from '@angular/core/testing';
import { TemplateResolverService } from './template-resolver.service';
import { BlockNode, TemplateContext } from './document.model';

function makeBlock(bindings: Record<string, string> = {}, settings: Record<string, unknown> = {}): BlockNode {
    return {
        id: 'test-block',
        type: 'hero',
        settings,
        bindings
    };
}

function makeContext(overrides: Partial<TemplateContext> = {}): TemplateContext {
    return {
        record: { title: 'Record Title', excerpt: 'Summary text', coverImage: 'https://img.example.com/img.jpg', count: 42, active: true },
        page: { title: 'Page Title', slug: 'my-page', description: 'Page desc' },
        tenant: { brandName: 'My Tenant', primaryColor: '#2563eb', logoUrl: 'https://logo.url' },
        ...overrides
    };
}

describe('TemplateResolverService', () => {
    let service: TemplateResolverService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TemplateResolverService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ─── No bindings ──────────────────────────────────────────

    it('no bindings: returns settings unchanged', () => {
        const block = makeBlock({}, { title: 'Static Title', color: 'red' });
        const result = service.resolve(block, makeContext());
        expect(result['title']).toBe('Static Title');
        expect(result['color']).toBe('red');
    });

    it('empty bindings object: returns settings unchanged', () => {
        const block: BlockNode = { id: 'x', type: 'hero', settings: { val: 99 }, bindings: {} };
        const result = service.resolve(block, makeContext());
        expect(result['val']).toBe(99);
    });

    // ─── Simple token resolution ──────────────────────────────

    it('binding {{record.title}}: resolves to context.record.title', () => {
        const block = makeBlock({ title: '{{record.title}}' }, { title: 'Static' });
        const result = service.resolve(block, makeContext());
        expect(result['title']).toBe('Record Title');
    });

    it('binding {{page.title}}: resolves to context.page.title', () => {
        const block = makeBlock({ heading: '{{page.title}}' }, { heading: 'Default' });
        const result = service.resolve(block, makeContext());
        expect(result['heading']).toBe('Page Title');
    });

    it('binding {{tenant.brandName}}: resolves to context.tenant.brandName', () => {
        const block = makeBlock({ footer: '{{tenant.brandName}}' }, { footer: '' });
        const result = service.resolve(block, makeContext());
        expect(result['footer']).toBe('My Tenant');
    });

    // ─── Dotted deep paths ────────────────────────────────────

    it('dotted path {{record.nested.city}}: walks nested object', () => {
        const ctx = makeContext({ record: { nested: { city: 'Durban' } } as any });
        const block = makeBlock({ city: '{{record.nested.city}}' }, {});
        const result = service.resolve(block, ctx);
        expect(result['city']).toBe('Durban');
    });

    // ─── Missing paths → empty string ─────────────────────────

    it('missing path returns empty string, not null or undefined', () => {
        const block = makeBlock({ title: '{{record.nonExistentField}}' }, { title: 'Default' });
        const result = service.resolve(block, makeContext());
        expect(result['title']).toBe('');
    });

    it('missing nested path returns empty string', () => {
        const block = makeBlock({ city: '{{record.address.city}}' }, {});
        const result = service.resolve(block, makeContext());
        expect(result['city']).toBe('');
    });

    it('context without record: all record.* bindings return empty string', () => {
        const block = makeBlock({ title: '{{record.title}}', sub: '{{record.excerpt}}' }, {});
        const result = service.resolve(block, { page: { title: 'P' }, tenant: { brandName: 'T' } });
        expect(result['title']).toBe('');
        expect(result['sub']).toBe('');
    });

    // ─── Mixed string tokens ──────────────────────────────────

    it('mixed string token: concatenates resolved values', () => {
        const block = makeBlock({ label: '{{tenant.brandName}} — {{page.title}}' }, {});
        const result = service.resolve(block, makeContext());
        expect(result['label']).toBe('My Tenant — Page Title');
    });

    // ─── Type preservation ────────────────────────────────────

    it('single pure token: preserves non-string type (number)', () => {
        const ctx = makeContext({ record: { count: 42 } });
        const block: BlockNode = {
            id: 'b',
            type: 'hero',
            settings: { count: 0 },
            bindings: { count: '{{record.count}}' }
        };
        const result = service.resolve(block, ctx);
        expect(result['count']).toBe(42);
    });

    it('single pure token: preserves boolean', () => {
        const ctx = makeContext({ record: { active: true } });
        const block: BlockNode = {
            id: 'b',
            type: 'hero',
            settings: { active: false },
            bindings: { active: '{{record.active}}' }
        };
        const result = service.resolve(block, ctx);
        expect(result['active']).toBe(true);
    });

    // ─── Does not mutate original block ───────────────────────

    it('does not mutate original block.settings', () => {
        const block = makeBlock({ title: '{{record.title}}' }, { title: 'Original' });
        service.resolve(block, makeContext());
        expect(block.settings['title']).toBe('Original');
    });

    // ─── resolvePath edge cases ───────────────────────────────

    it('resolvePath: handles null intermediate gracefully', () => {
        const result = service.resolvePath('record.address.city', { record: null as any });
        expect(result).toBe('');
    });

    it('resolveToken: returns non-string input unchanged', () => {
        const result = service.resolveToken(42 as any, makeContext());
        expect(result).toBe(42);
    });
});
