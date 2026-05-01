import { BlockNode } from '../document.model';
import { buildRenderableWidgetConfig, getBlockWrapperRenderStyles, resolveEffectiveWidgetSettings } from './block-render.util';

describe('block-render util', () => {
    it('advanced styles override supported widget style settings', () => {
        const resolved = resolveEffectiveWidgetSettings(
            {
                backgroundColor: '#ffffff',
                padding: 8,
                borderRadius: 4,
                fontSize: 12,
                titleColor: '#ff00ff'
            },
            {
                background: { type: 'solid', color: '#112233' },
                paddingTop: 24,
                paddingRight: 24,
                paddingBottom: 24,
                paddingLeft: 24,
                borderRadius: 16,
                fontSize: 18
            }
        );

        expect(resolved['backgroundColor']).toBe('#112233');
        expect(resolved['backgroundOpacity']).toBe(1);
        expect(resolved['padding']).toBe(24);
        expect(resolved['borderRadius']).toBe(16);
        expect(resolved['fontSize']).toBe(18);
        expect(resolved['titleColor']).toBe('#ff00ff');
    });

    it('builds renderable widget config with resolved settings and metadata', () => {
        const block: BlockNode = {
            id: 'hero-1',
            type: 'hero',
            settings: { backgroundColor: '#ffffff', title: 'Hero' },
            blockStyles: {
                background: { type: 'solid', color: '#000000' },
                borderRadius: 12
            }
        };

        const config = buildRenderableWidgetConfig(block);
        expect(config.settings.backgroundColor).toBe('#000000');
        expect(config.blockStyles?.borderRadius).toBe(12);
    });

    it('hides blocks for the active breakpoint in wrapper styles', () => {
        const styles = getBlockWrapperRenderStyles(
            {
                visibility: { hideOnMobile: true },
                blockStyles: { paddingTop: 10 }
            },
            'mobile'
        );

        expect(styles['display']).toBe('none');
    });
});