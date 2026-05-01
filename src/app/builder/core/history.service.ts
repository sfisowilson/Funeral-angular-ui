import { computed, Injectable, signal } from '@angular/core';
import type { EditorCommand } from './commands';
import { UpdateBlockSettingsCommand } from './commands';

const MAX_HISTORY = 50;

/**
 * HistoryService tracks past/future EditorCommand stacks for undo/redo.
 *
 * It does NOT call PageDocumentStore.dispatch — it only manages the stacks.
 * PageDocumentStore.dispatch() is responsible for calling historyService.push()
 * after applying a command. The store calls undo/redo directly by peeking at
 * the stacks and applying the command inverse.
 *
 * Coalescing: consecutive UpdateBlockSettings commands on the same blockId
 * are merged by replacing the last entry's newSettings, keeping the original
 * previousSettings. This prevents a rapid slider drag from creating 100 entries.
 */
@Injectable({ providedIn: 'root' })
export class HistoryService {
    readonly past = signal<EditorCommand[]>([]);
    readonly future = signal<EditorCommand[]>([]);

    readonly canUndo = computed(() => this.past().length > 0);
    readonly canRedo = computed(() => this.future().length > 0);

    readonly undoLabel = computed(() => {
        const stack = this.past();
        return stack.length > 0 ? stack[stack.length - 1].label : '';
    });

    readonly redoLabel = computed(() => {
        const stack = this.future();
        return stack.length > 0 ? stack[stack.length - 1].label : '';
    });

    /**
     * Push a command onto the past stack. Clears future. Applies coalescing.
     * SetDocument commands clear the entire history (treated as full replacement).
     */
    push(cmd: EditorCommand): void {
        if (cmd.type === 'set-document') {
            this.past.set([]);
            this.future.set([]);
            return;
        }

        this.future.set([]);

        // Coalesce consecutive UpdateBlockSettings on the same blockId
        if (cmd.type === 'update-block-settings') {
            const updateCmd = cmd as UpdateBlockSettingsCommand;
            const current = this.past();
            if (current.length > 0) {
                const last = current[current.length - 1];
                if (
                    last.type === 'update-block-settings' &&
                    (last as UpdateBlockSettingsCommand).blockId === updateCmd.blockId
                ) {
                    // Replace: keep original's undo capability but track latest settings
                    const coalesced = new UpdateBlockSettingsCommand(
                        updateCmd.blockId,
                        (updateCmd as UpdateBlockSettingsCommand)['newSettings'],
                        (last as UpdateBlockSettingsCommand)['previousSettings']
                    );
                    this.past.update((stack) => [...stack.slice(0, -1), coalesced]);
                    return;
                }
            }
        }

        // Cap at MAX_HISTORY
        this.past.update((stack) => {
            const next = [...stack, cmd];
            return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
        });
    }

    /**
     * Pop from past and return the command to undo. Returns null if nothing to undo.
     * Caller must apply command.undo(doc) and push the original command to future.
     */
    popUndo(): EditorCommand | null {
        const stack = this.past();
        if (stack.length === 0) return null;
        const cmd = stack[stack.length - 1];
        this.past.update((s) => s.slice(0, -1));
        this.future.update((s) => [...s, cmd]);
        return cmd;
    }

    /**
     * Pop from future and return the command to redo.
     * Caller must apply command.execute(doc) and push to past.
     */
    popRedo(): EditorCommand | null {
        const stack = this.future();
        if (stack.length === 0) return null;
        const cmd = stack[stack.length - 1];
        this.future.update((s) => s.slice(0, -1));
        this.past.update((s) => [...s, cmd]);
        return cmd;
    }

    /**
     * Undo all commands up to and including the command at the given past stack index.
     * Returns the commands that should be applied in reverse order.
     */
    undoToIndex(index: number): EditorCommand[] {
        const stack = this.past();
        if (index < 0 || index >= stack.length) return [];
        const toUndo = stack.slice(index);
        const toKeep = stack.slice(0, index);
        this.past.set(toKeep);
        this.future.update((f) => [...toUndo.reverse(), ...f]);
        return toUndo;
    }

    /** Clear all history (e.g. after a full page reload) */
    clear(): void {
        this.past.set([]);
        this.future.set([]);
    }
}
