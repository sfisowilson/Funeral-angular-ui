import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { UpdateBlockSettingsCommand, AddBlockCommand, DeleteBlockCommand } from './commands';
import { BlockNode, PageDocument } from './document.model';

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
                        blocks: [{ id: 'block-1', type: 'hero', settings: { title: 'Hello' } }]
                    }
                ]
            }
        ]
    };
}

function makeUpdateCmd(blockId = 'block-1', newSettings = {}, prevSettings = {}): UpdateBlockSettingsCommand {
    return new UpdateBlockSettingsCommand(blockId, newSettings, prevSettings);
}

describe('HistoryService', () => {
    let service: HistoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HistoryService);
    });

    it('should start with empty stacks', () => {
        expect(service.past().length).toBe(0);
        expect(service.future().length).toBe(0);
        expect(service.canUndo()).toBe(false);
        expect(service.canRedo()).toBe(false);
    });

    it('push adds command to past and clears future', () => {
        const cmd = makeUpdateCmd();
        service.future.set([new AddBlockCommand('col-1', { id: 'x', type: 'hero', settings: {} })]);
        service.push(cmd);
        expect(service.past().length).toBe(1);
        expect(service.future().length).toBe(0);
    });

    it('canUndo is true after push', () => {
        service.push(makeUpdateCmd());
        expect(service.canUndo()).toBe(true);
    });

    it('canRedo is false after push', () => {
        service.push(makeUpdateCmd());
        expect(service.canRedo()).toBe(false);
    });

    it('popUndo moves last past entry to future', () => {
        const cmd = makeUpdateCmd('block-1', { a: 1 }, {});
        service.push(cmd);
        const popped = service.popUndo();
        expect(popped).toBeTruthy();
        expect(popped!.type).toBe('update-block-settings');
        expect(service.past().length).toBe(0);
        expect(service.future().length).toBe(1);
    });

    it('popRedo moves last future entry to past', () => {
        const cmd = makeUpdateCmd();
        service.push(cmd);
        service.popUndo();
        const redoCmd = service.popRedo();
        expect(redoCmd).toBeTruthy();
        expect(service.past().length).toBe(1);
        expect(service.future().length).toBe(0);
    });

    it('undoLabel shows last command label', () => {
        const cmd = new AddBlockCommand('col-1', { id: 'b', type: 'hero', settings: {} });
        service.push(cmd);
        expect(service.undoLabel()).toBe('Add hero');
    });

    it('redoLabel shows top of future stack', () => {
        const cmd = new AddBlockCommand('col-1', { id: 'b', type: 'hero', settings: {} });
        service.push(cmd);
        service.popUndo();
        expect(service.redoLabel()).toBe('Add hero');
    });

    describe('Coalescing UpdateBlockSettings', () => {
        it('consecutive UpdateBlockSettings on same blockId are coalesced into one entry', () => {
            service.push(makeUpdateCmd('block-1', { title: 'A' }, { title: '' }));
            service.push(makeUpdateCmd('block-1', { title: 'AB' }, { title: 'A' }));
            service.push(makeUpdateCmd('block-1', { title: 'ABC' }, { title: 'AB' }));
            expect(service.past().length).toBe(1);
        });

        it('coalesced entry preserves original previousSettings', () => {
            service.push(makeUpdateCmd('block-1', { title: 'A' }, { title: 'original' }));
            service.push(makeUpdateCmd('block-1', { title: 'B' }, { title: 'A' }));
            const entry = service.past()[0] as UpdateBlockSettingsCommand;
            expect((entry as any)['previousSettings']).toEqual({ title: 'original' });
        });

        it('UpdateBlockSettings on DIFFERENT blockIds are NOT coalesced', () => {
            service.push(makeUpdateCmd('block-1', { title: 'A' }, {}));
            service.push(makeUpdateCmd('block-2', { title: 'B' }, {}));
            expect(service.past().length).toBe(2);
        });

        it('non-UpdateBlockSettings between two UpdateBlockSettings breaks coalescing', () => {
            service.push(makeUpdateCmd('block-1', { title: 'A' }, {}));
            service.push(new AddBlockCommand('col-1', { id: 'new', type: 'hero', settings: {} }));
            service.push(makeUpdateCmd('block-1', { title: 'B' }, { title: 'A' }));
            expect(service.past().length).toBe(3);
        });
    });

    it('caps at 50 entries', () => {
        for (let i = 0; i < 55; i++) {
            service.push(new AddBlockCommand('col-1', { id: `block-${i}`, type: 'hero', settings: {} }));
        }
        expect(service.past().length).toBe(50);
    });

    it('set-document command clears all history', () => {
        service.push(makeUpdateCmd('block-1', { a: 1 }, {}));
        service.push(makeUpdateCmd('block-1', { a: 2 }, { a: 1 }));
        const setCmd = { type: 'set-document', id: 'x', label: 'Load', timestamp: 0, execute: (d: any) => d, undo: (d: any) => d };
        service.push(setCmd);
        expect(service.past().length).toBe(0);
        expect(service.future().length).toBe(0);
    });

    it('undoToIndex returns commands to undo and moves them to future', () => {
        service.push(makeUpdateCmd('b1', { a: 1 }, {}));
        service.push(makeUpdateCmd('b2', { a: 2 }, { a: 1 }));
        service.push(makeUpdateCmd('b3', { a: 3 }, { a: 2 }));
        const cmds = service.undoToIndex(1);
        expect(cmds.length).toBe(2);
        expect(service.past().length).toBe(1);
    });

    it('clear resets both stacks', () => {
        service.push(makeUpdateCmd('b', {}, {}));
        service.clear();
        expect(service.past().length).toBe(0);
        expect(service.future().length).toBe(0);
    });
});
