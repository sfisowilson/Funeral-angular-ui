import { WidgetConfig } from '../../../building-blocks/widget-config';
import { flatToV3, isV3Document } from './flat-to-v3.util';
import { v3ToFlat } from './v3-to-flat.util';
import { BlockStyles, PageDocument } from '../document.model';

function makeWidget(overrides: Partial<WidgetConfig> & { id: string; type: string }): WidgetConfig {
    return {
        settings: {},
        layout: {
            column: 1,
            columnSpan: 12,
            row: 1,
            rowSpan: 1,
            fullWidth: true,
            autoHeight: true
        },
        ...overrides
    } as WidgetConfig;
}

describe('flatToV3', () => {
    it('empty array produces document with no sections', () => {
        const doc = flatToV3([]);
        expect(doc.__version).toBe(3);
        expect(doc.sections.length).toBe(0);
    });

    it('5 full-width widgets → 5 single-column sections', () => {
        const widgets = [1, 2, 3, 4, 5].map((i) =>
            makeWidget({ id: `w${i}`, type: 'hero', layout: { column: 1, columnSpan: 12, row: i, rowSpan: 1, fullWidth: true, autoHeight: true } })
        );
        const doc = flatToV3(widgets);
        expect(doc.sections.length).toBe(5);
        doc.sections.forEach((s) => {
            expect(s.columns.length).toBe(1);
            expect(s.columns[0].widthFraction).toBeCloseTo(1);
        });
    });

    it('widgets sharing same row → single section, multiple columns', () => {
        const widgets = [
            makeWidget({ id: 'left', type: 'hero', layout: { column: 1, columnSpan: 6, row: 1, rowSpan: 1, fullWidth: false, autoHeight: true } }),
            makeWidget({ id: 'right', type: 'stats-counter', layout: { column: 7, columnSpan: 6, row: 1, rowSpan: 1, fullWidth: false, autoHeight: true } })
        ];
        const doc = flatToV3(widgets);
        expect(doc.sections.length).toBe(1);
        expect(doc.sections[0].columns.length).toBe(2);
        expect(doc.sections[0].columns[0].widthFraction).toBeCloseTo(0.5);
        expect(doc.sections[0].columns[1].widthFraction).toBeCloseTo(0.5);
    });

    it('widgets with different rows → multiple sections in correct order', () => {
        const widgets = [
            makeWidget({ id: 'b', type: 'hero', layout: { column: 1, columnSpan: 12, row: 2, rowSpan: 1, fullWidth: true, autoHeight: true } }),
            makeWidget({ id: 'a', type: 'stats-counter', layout: { column: 1, columnSpan: 12, row: 1, rowSpan: 1, fullWidth: true, autoHeight: true } })
        ];
        const doc = flatToV3(widgets);
        expect(doc.sections[0].columns[0].blocks[0].id).toBe('a'); // row 1 first
        expect(doc.sections[1].columns[0].blocks[0].id).toBe('b'); // row 2 second
    });

    it('widget settings are preserved in the block', () => {
        const widget = makeWidget({
            id: 'hero-1',
            type: 'hero',
            settings: { title: 'Test Title', titleSize: 48, backgroundColor: '#ff0000' }
        });
        const doc = flatToV3([widget]);
        const block = doc.sections[0].columns[0].blocks[0];
        expect(block.settings['title']).toBe('Test Title');
        expect(block.settings['titleSize']).toBe(48);
        expect(block.settings['backgroundColor']).toBe('#ff0000');
    });

    it('widget with no layout data falls back to single-column section', () => {
        const widget: WidgetConfig = { id: 'no-layout', type: 'hero', settings: {} };
        const doc = flatToV3([widget]);
        expect(doc.sections.length).toBe(1);
        expect(doc.sections[0].columns[0].widthFraction).toBeCloseTo(1);
    });

    it('produces a v3 document detectable by isV3Document', () => {
        const doc = flatToV3([makeWidget({ id: 'w1', type: 'hero' })]);
        expect(isV3Document(doc)).toBe(true);
    });

    it('isV3Document returns false for flat array', () => {
        const flat = [makeWidget({ id: 'w1', type: 'hero' })];
        expect(isV3Document(flat)).toBe(false);
    });
});

describe('v3ToFlat', () => {
    it('round-trip preserves all widget types', () => {
        const widgets = [
            makeWidget({ id: 'w1', type: 'hero', settings: { title: 'H' } }),
            makeWidget({ id: 'w2', type: 'stats-counter', settings: { count: 3 } }),
            makeWidget({ id: 'w3', type: 'cta-banner', settings: { text: 'CTA' }, layout: { column: 1, columnSpan: 12, row: 2, rowSpan: 1, fullWidth: true, autoHeight: true } })
        ];
        const doc = flatToV3(widgets, 'page-rt');
        const flat = v3ToFlat(doc);
        expect(flat.length).toBe(3);
        const types = flat.map((w) => w.type);
        expect(types).toContain('hero');
        expect(types).toContain('stats-counter');
        expect(types).toContain('cta-banner');
    });

    it('round-trip preserves widget id', () => {
        const widgets = [makeWidget({ id: 'unique-id', type: 'hero', settings: { title: 'Title' } })];
        const doc = flatToV3(widgets);
        const flat = v3ToFlat(doc);
        expect(flat[0].id).toBe('unique-id');
    });

    it('round-trip preserves settings content', () => {
        const settings = { title: 'Hello World', backgroundColor: '#123456', padding: 80 };
        const widget = makeWidget({ id: 'w1', type: 'hero', settings });
        const doc = flatToV3([widget]);
        const flat = v3ToFlat(doc);
        expect(flat[0].settings['title']).toBe('Hello World');
        expect(flat[0].settings['backgroundColor']).toBe('#123456');
    });

    it('round-trip preserves advanced block styling metadata', () => {
        const blockStyles: BlockStyles = {
            background: { type: 'solid', color: '#112233' },
            borderRadius: 24,
            fontSize: 18,
            paddingTop: 32,
            paddingRight: 32,
            paddingBottom: 32,
            paddingLeft: 32
        };
        const widget = makeWidget({
            id: 'w-style',
            type: 'hero',
            settings: { backgroundColor: '#ffffff', title: 'Styled hero' },
            blockStyles,
            visibility: { hideOnMobile: true }
        });

        const doc = flatToV3([widget]);
        const block = doc.sections[0].columns[0].blocks[0];
        expect(block.blockStyles?.borderRadius).toBe(24);
        expect(block.visibility?.hideOnMobile).toBeTrue();

        const flat = v3ToFlat(doc);
        expect(flat[0].blockStyles?.background?.type).toBe('solid');
        expect(flat[0].blockStyles?.background?.color).toBe('#112233');
        expect(flat[0].visibility?.hideOnMobile).toBeTrue();
    });

    it('round-trip of empty document produces empty array', () => {
        const doc = flatToV3([]);
        const flat = v3ToFlat(doc);
        expect(flat.length).toBe(0);
    });

    it('layout.row and layout.column are set correctly', () => {
        const widgets = [
            makeWidget({ id: 'r1', type: 'hero', layout: { column: 1, columnSpan: 12, row: 1, rowSpan: 1, fullWidth: true, autoHeight: true } }),
            makeWidget({ id: 'r2', type: 'stats-counter', layout: { column: 1, columnSpan: 12, row: 2, rowSpan: 1, fullWidth: true, autoHeight: true } })
        ];
        const doc = flatToV3(widgets);
        const flat = v3ToFlat(doc);
        expect(flat.find((w) => w.id === 'r1')!.layout!.row).toBe(1);
        expect(flat.find((w) => w.id === 'r2')!.layout!.row).toBe(2);
    });
});
