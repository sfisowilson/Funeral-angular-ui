import { PageDocument } from '../document.model';

/**
 * Base interface for all editor commands.
 * Commands are pure functions: execute and undo both receive and return
 * a PageDocument without side effects. Use structuredClone for immutability.
 */
export interface EditorCommand {
    /** Unique command instance id (UUID) */
    id: string;
    /** Human-readable label for history panel */
    label: string;
    /** Command type discriminator */
    type: string;
    /** Unix timestamp of when command was created */
    timestamp: number;
    /**
     * Apply the command and return the new document state.
     * Must NOT mutate the incoming document — always clone first.
     */
    execute(doc: PageDocument): PageDocument;
    /**
     * Reverse the command and return the previous document state.
     * Must NOT mutate the incoming document.
     */
    undo(doc: PageDocument): PageDocument;
}
