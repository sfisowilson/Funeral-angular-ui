import { PageDocument } from '../document.model';
import {
    AddBlockCommand,
    DeleteBlockCommand,
    MoveBlockCommand,
    UpdateBlockSettingsCommand,
    AddSectionCommand,
    DeleteSectionCommand,
    MoveSectionCommand,
    ResizeColumnCommand,
    BatchCommand
} from '../commands';
import { BlockNode, SectionNode } from '../document.model';

function makeDoc(): PageDocument {
    return {
        __version: 3,
        type: 'page',
        id: 'test-doc',
        sections: [
            {
                id: 'section-1',
                settings: {},
                columns: [
                    {
                        id: 'col-1',
                        widthFraction: 0.5,
                        blocks: [
                            { id: 'block-1', type: 'hero', settings: { title: 'Hello' } },
                            { id: 'block-2', type: 'stats-counter', settings: { count: 5 } }
                        ]
                    },
                    {
                        id: 'col-2',
                        widthFraction: 0.5,
                        blocks: [{ id: 'block-3', type: 'cta-banner', settings: { text: 'CTA' } }]
                    }
                ]
            },
            {
                id: 'section-2',
                settings: {},
                columns: [
                    {
                        id: 'col-3',
                        widthFraction: 1,
                        blocks: [{ id: 'block-4', type: 'feature-grid', settings: {} }]
                    }
                ]
            }
        ]
    };
}

function makeBlock(id = 'new-block'): BlockNode {
    return { id, type: 'gallery', settings: { images: [] } };
}

describe('EditorCommands', () => {
    // ─── AddBlockCommand ────────────────────────────────────────

    describe('AddBlockCommand', () => {
        it('execute: adds block to specified column at default end', () => {
            const doc = makeDoc();
            const block = makeBlock('added');
            const cmd = new AddBlockCommand('col-1', block);
            const result = cmd.execute(doc);
            const blocks = result.sections[0].columns[0].blocks;
            expect(blocks.length).toBe(3);
            expect(blocks[2].id).toBe('added');
        });

        it('execute: adds block at specified index', () => {
            const doc = makeDoc();
            const block = makeBlock('inserted');
            const cmd = new AddBlockCommand('col-1', block, 0);
            const result = cmd.execute(doc);
            expect(result.sections[0].columns[0].blocks[0].id).toBe('inserted');
        });

        it('undo: removes the added block', () => {
            const doc = makeDoc();
            const block = makeBlock('undo-add');
            const cmd = new AddBlockCommand('col-1', block);
            const withBlock = cmd.execute(doc);
            const without = cmd.undo(withBlock);
            const blocks = without.sections[0].columns[0].blocks;
            expect(blocks.find((b) => b.id === 'undo-add')).toBeUndefined();
        });

        it('execute: does not mutate original document', () => {
            const doc = makeDoc();
            const originalLength = doc.sections[0].columns[0].blocks.length;
            const cmd = new AddBlockCommand('col-1', makeBlock());
            cmd.execute(doc);
            expect(doc.sections[0].columns[0].blocks.length).toBe(originalLength);
        });

        it('execute: no-op when column not found', () => {
            const doc = makeDoc();
            const cmd = new AddBlockCommand('nonexistent-col', makeBlock());
            const result = cmd.execute(doc);
            expect(result.sections[0].columns[0].blocks.length).toBe(doc.sections[0].columns[0].blocks.length);
        });
    });

    // ─── DeleteBlockCommand ────────────────────────────────────

    describe('DeleteBlockCommand', () => {
        it('execute: removes block from its column', () => {
            const doc = makeDoc();
            const cmd = new DeleteBlockCommand('block-1');
            const result = cmd.execute(doc);
            expect(result.sections[0].columns[0].blocks.find((b) => b.id === 'block-1')).toBeUndefined();
        });

        it('execute: removes recursively nested child blocks', () => {
            const doc = makeDoc();
            doc.sections[0].columns[0].blocks[0].children = [
                {
                    id: 'child-1',
                    type: 'hero',
                    settings: {},
                    children: [{ id: 'grandchild-1', type: 'gallery', settings: {} }]
                }
            ];

            const cmd = new DeleteBlockCommand('grandchild-1');
            const result = cmd.execute(doc);

            expect(result.sections[0].columns[0].blocks[0].children?.[0].children?.find((b) => b.id === 'grandchild-1')).toBeUndefined();
        });

        it('undo: restores deleted block at original index', () => {
            const doc = makeDoc();
            const cmd = new DeleteBlockCommand('block-1');
            const deleted = cmd.execute(doc);
            const restored = cmd.undo(deleted);
            const blocks = restored.sections[0].columns[0].blocks;
            expect(blocks.find((b) => b.id === 'block-1')).toBeTruthy();
            expect(blocks[0].id).toBe('block-1'); // was at index 0
        });

        it('undo: restores recursively nested child blocks at the original position', () => {
            const doc = makeDoc();
            doc.sections[0].columns[0].blocks[0].children = [
                {
                    id: 'child-1',
                    type: 'hero',
                    settings: {},
                    children: [{ id: 'grandchild-1', type: 'gallery', settings: {} }]
                }
            ];

            const cmd = new DeleteBlockCommand('grandchild-1');
            const deleted = cmd.execute(doc);
            const restored = cmd.undo(deleted);

            expect(restored.sections[0].columns[0].blocks[0].children?.[0].children?.[0].id).toBe('grandchild-1');
        });

        it('execute: does not mutate original', () => {
            const doc = makeDoc();
            const cmd = new DeleteBlockCommand('block-1');
            cmd.execute(doc);
            expect(doc.sections[0].columns[0].blocks.length).toBe(2);
        });
    });

    // ─── MoveBlockCommand ──────────────────────────────────────

    describe('MoveBlockCommand', () => {
        it('execute: reorders block within same column', () => {
            const doc = makeDoc();
            const cmd = new MoveBlockCommand({ blockId: 'block-1', fromColumnId: 'col-1', fromIndex: 0, toColumnId: 'col-1', toIndex: 1 });
            const result = cmd.execute(doc);
            const blocks = result.sections[0].columns[0].blocks;
            expect(blocks[0].id).toBe('block-2');
            expect(blocks[1].id).toBe('block-1');
        });

        it('execute: moves block from one column to another', () => {
            const doc = makeDoc();
            const cmd = new MoveBlockCommand({ blockId: 'block-1', fromColumnId: 'col-1', fromIndex: 0, toColumnId: 'col-2', toIndex: 0 });
            const result = cmd.execute(doc);
            expect(result.sections[0].columns[0].blocks.find((b) => b.id === 'block-1')).toBeUndefined();
            expect(result.sections[0].columns[1].blocks.find((b) => b.id === 'block-1')).toBeTruthy();
        });

        it('undo: reverses a cross-column move', () => {
            const doc = makeDoc();
            const cmd = new MoveBlockCommand({ blockId: 'block-1', fromColumnId: 'col-1', fromIndex: 0, toColumnId: 'col-2', toIndex: 0 });
            const moved = cmd.execute(doc);
            const reverted = cmd.undo(moved);
            expect(reverted.sections[0].columns[0].blocks[0].id).toBe('block-1');
        });
    });

    // ─── UpdateBlockSettingsCommand ────────────────────────────

    describe('UpdateBlockSettingsCommand', () => {
        it('execute: patches block settings', () => {
            const doc = makeDoc();
            const cmd = new UpdateBlockSettingsCommand('block-1', { title: 'New Title', color: 'red' }, { title: 'Hello' });
            const result = cmd.execute(doc);
            const block = result.sections[0].columns[0].blocks[0];
            expect(block.settings['title']).toBe('New Title');
            expect(block.settings['color']).toBe('red');
        });

        it('undo: restores previous settings', () => {
            const doc = makeDoc();
            const prev = { title: 'Hello' };
            const cmd = new UpdateBlockSettingsCommand('block-1', { title: 'New Title' }, prev);
            const updated = cmd.execute(doc);
            const reverted = cmd.undo(updated);
            expect(reverted.sections[0].columns[0].blocks[0].settings['title']).toBe('Hello');
        });

        it('execute: does not mutate original', () => {
            const doc = makeDoc();
            const cmd = new UpdateBlockSettingsCommand('block-1', { title: 'New' }, { title: 'Hello' });
            cmd.execute(doc);
            expect(doc.sections[0].columns[0].blocks[0].settings['title']).toBe('Hello');
        });

        it('execute: patches recursively nested child block settings', () => {
            const doc = makeDoc();
            doc.sections[0].columns[0].blocks[0].children = [
                {
                    id: 'child-1',
                    type: 'hero',
                    settings: {},
                    children: [{ id: 'grandchild-1', type: 'gallery', settings: { title: 'Old' } }]
                }
            ];

            const cmd = new UpdateBlockSettingsCommand('grandchild-1', { title: 'New Nested Title' }, { title: 'Old' });
            const result = cmd.execute(doc);

            expect(result.sections[0].columns[0].blocks[0].children?.[0].children?.[0].settings['title']).toBe('New Nested Title');
        });
    });

    // ─── ResizeColumnCommand ───────────────────────────────────

    describe('ResizeColumnCommand', () => {
        it('execute: updates column widthFractions', () => {
            const doc = makeDoc();
            const cmd = new ResizeColumnCommand('section-1', [0.3, 0.7], [0.5, 0.5]);
            const result = cmd.execute(doc);
            expect(result.sections[0].columns[0].widthFraction).toBeCloseTo(0.3);
            expect(result.sections[0].columns[1].widthFraction).toBeCloseTo(0.7);
        });

        it('undo: restores previous widthFractions', () => {
            const doc = makeDoc();
            const cmd = new ResizeColumnCommand('section-1', [0.3, 0.7], [0.5, 0.5]);
            const resized = cmd.execute(doc);
            const restored = cmd.undo(resized);
            expect(restored.sections[0].columns[0].widthFraction).toBeCloseTo(0.5);
            expect(restored.sections[0].columns[1].widthFraction).toBeCloseTo(0.5);
        });
    });

    // ─── BatchCommand ──────────────────────────────────────────

    describe('BatchCommand', () => {
        it('execute: applies all child commands in order', () => {
            const doc = makeDoc();
            const block1 = makeBlock('batch-1');
            const block2 = makeBlock('batch-2');
            const batch = new BatchCommand('Add two blocks', [
                new AddBlockCommand('col-1', block1),
                new AddBlockCommand('col-1', block2)
            ]);
            const result = batch.execute(doc);
            const blocks = result.sections[0].columns[0].blocks;
            expect(blocks.find((b) => b.id === 'batch-1')).toBeTruthy();
            expect(blocks.find((b) => b.id === 'batch-2')).toBeTruthy();
        });

        it('undo: reverses child commands in reverse order', () => {
            const doc = makeDoc();
            const block1 = makeBlock('batch-undo-1');
            const block2 = makeBlock('batch-undo-2');
            const batch = new BatchCommand('Add two blocks', [
                new AddBlockCommand('col-1', block1),
                new AddBlockCommand('col-1', block2)
            ]);
            const withBlocks = batch.execute(doc);
            const reverted = batch.undo(withBlocks);
            const blocks = reverted.sections[0].columns[0].blocks;
            expect(blocks.find((b) => b.id === 'batch-undo-1')).toBeUndefined();
            expect(blocks.find((b) => b.id === 'batch-undo-2')).toBeUndefined();
        });
    });

    // ─── MoveSectionCommand ───────────────────────────────────

    describe('MoveSectionCommand', () => {
        it('execute: moves section 0 to index 1', () => {
            const doc = makeDoc();
            const cmd = new MoveSectionCommand('section-1', 0, 1);
            const result = cmd.execute(doc);
            expect(result.sections[0].id).toBe('section-2');
            expect(result.sections[1].id).toBe('section-1');
        });

        it('undo: reverses section move', () => {
            const doc = makeDoc();
            const cmd = new MoveSectionCommand('section-1', 0, 1);
            const moved = cmd.execute(doc);
            const restored = cmd.undo(moved);
            expect(restored.sections[0].id).toBe('section-1');
        });
    });
});
