import { TestBed } from '@angular/core/testing';
import { PageDocumentStore } from './page-document.store';
import { HistoryService } from './history.service';
import { AddBlockCommand, DeleteBlockCommand, SetDocumentCommand, UpdateBlockSettingsCommand } from './commands';
import { BlockNode, PageDocument, SectionNode } from './document.model';

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
                        widthFraction: 1,
                        blocks: [
                            { id: 'block-1', type: 'hero', settings: { title: 'Hello' } },
                            { id: 'block-2', type: 'stats-counter', settings: { count: 5 } }
                        ]
                    }
                ]
            }
        ]
    };
}

function makeBlock(id = 'new-block'): BlockNode {
    return { id, type: 'cta-banner', settings: { text: 'Click me' } };
}

describe('PageDocumentStore', () => {
    let store: PageDocumentStore;
    let history: HistoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.inject(PageDocumentStore);
        history = TestBed.inject(HistoryService);
        store.setDocument(makeDoc());
    });

    it('should populate document signal after setDocument', () => {
        const doc = store.document();
        expect(doc).not.toBeNull();
        expect(doc!.id).toBe('test-doc');
    });

    it('should compute selectedBlock when selectedId is set', () => {
        expect(store.selectedBlock()).toBeNull();
        store.selectedId.set('block-1');
        expect(store.selectedBlock()?.id).toBe('block-1');
    });

    it('should compute selectedBlock for recursively nested child blocks', () => {
        const docWithNestedChildren = makeDoc();
        docWithNestedChildren.sections[0].columns[0].blocks[0].children = [
            {
                id: 'child-1',
                type: 'hero',
                settings: {},
                children: [{ id: 'grandchild-1', type: 'cta-banner', settings: {} }]
            }
        ];

        store.setDocument(docWithNestedChildren);
        store.selectedId.set('grandchild-1');

        expect(store.selectedBlock()?.id).toBe('grandchild-1');
    });

    it('should return null for selectedBlock when selectedId does not match', () => {
        store.selectedId.set('nonexistent');
        expect(store.selectedBlock()).toBeNull();
    });

    it('should update document signal after dispatch with AddBlockCommand', () => {
        const block = makeBlock();
        const cmd = new AddBlockCommand('col-1', block);
        store.dispatch(cmd);
        const doc = store.document()!;
        const blocks = doc.sections[0].columns[0].blocks;
        expect(blocks.find((b) => b.id === block.id)).toBeTruthy();
    });

    it('should push command to history after dispatch', () => {
        const block = makeBlock();
        const cmd = new AddBlockCommand('col-1', block);
        store.dispatch(cmd);
        expect(history.past().length).toBe(1);
        expect(history.past()[0].type).toBe('add-block');
    });

    it('should toggle previewMode signal', () => {
        expect(store.previewMode()).toBe(false);
        store.previewMode.set(true);
        expect(store.previewMode()).toBe(true);
    });

    it('should clear selectedId and history on setDocument', () => {
        store.selectedId.set('block-1');
        store.dispatch(new AddBlockCommand('col-1', makeBlock()));
        store.setDocument(makeDoc());
        expect(store.selectedId()).toBeNull();
        expect(history.past().length).toBe(0);
    });

    it('undo should restore previous document state', () => {
        const block = makeBlock('undo-block');
        store.dispatch(new AddBlockCommand('col-1', block));
        expect(store.document()!.sections[0].columns[0].blocks.length).toBe(3);
        store.undo();
        expect(store.document()!.sections[0].columns[0].blocks.length).toBe(2);
    });

    it('redo should reapply command after undo', () => {
        const block = makeBlock('redo-block');
        store.dispatch(new AddBlockCommand('col-1', block));
        store.undo();
        store.redo();
        const blocks = store.document()!.sections[0].columns[0].blocks;
        expect(blocks.find((b) => b.id === block.id)).toBeTruthy();
    });

    it('isDragging should be false by default', () => {
        expect(store.isDragging()).toBe(false);
    });

    it('isDragging should be true when dragState is set', () => {
        store.dragState.set({ source: 'library', widgetType: 'hero' });
        expect(store.isDragging()).toBe(true);
    });

    it('flatBlocks should list all blocks across sections and columns', () => {
        const flat = store.flatBlocks();
        expect(flat.length).toBe(2);
        expect(flat[0].block.id).toBe('block-1');
        expect(flat[1].block.id).toBe('block-2');
    });

    it('flatBlocks should include children blocks with depth 1', () => {
        const docWithChildren = makeDoc();
        docWithChildren.sections[0].columns[0].blocks[0].children = [
            { id: 'child-1', type: 'hero', settings: {} }
        ];
        store.setDocument(docWithChildren);
        const flat = store.flatBlocks();
        const child = flat.find((f) => f.block.id === 'child-1');
        expect(child).toBeTruthy();
        expect(child!.depth).toBe(1);
    });

    it('flatBlocks should include deeply nested children with increasing depth', () => {
        const docWithNestedChildren = makeDoc();
        docWithNestedChildren.sections[0].columns[0].blocks[0].children = [
            {
                id: 'child-1',
                type: 'hero',
                settings: {},
                children: [{ id: 'grandchild-1', type: 'cta-banner', settings: {} }]
            }
        ];

        store.setDocument(docWithNestedChildren);
        const flat = store.flatBlocks();
        const grandchild = flat.find((f) => f.block.id === 'grandchild-1');

        expect(grandchild).toBeTruthy();
        expect(grandchild!.depth).toBe(2);
        expect(grandchild!.childPath).toEqual([0, 0]);
    });

    it('enterInnerTemplate sets innerTemplateBlockId and clears selectedId', () => {
        store.selectedId.set('block-1');
        store.enterInnerTemplate('block-1');
        expect(store.innerTemplateBlockId()).toBe('block-1');
        expect(store.selectedId()).toBeNull();
    });

    it('exitInnerTemplate clears innerTemplateBlockId', () => {
        store.enterInnerTemplate('block-1');
        store.exitInnerTemplate();
        expect(store.innerTemplateBlockId()).toBeNull();
    });
});
