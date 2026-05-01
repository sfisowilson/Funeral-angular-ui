import { Injectable } from '@angular/core';
import { BlockNode, TemplateContext } from './document.model';

/**
 * TemplateResolverService — pure service for resolving token bindings.
 *
 * Resolves {{token.path}} expressions in block.bindings against a TemplateContext.
 * Returns a shallow-merged copy of block.settings with binding values applied.
 * Never throws — missing paths return empty string.
 *
 * Token syntax: {{context.path.to.value}}
 * Examples:
 *   {{record.title}} → context.record.title
 *   {{record.dataJson.address.city}} → context.record.dataJson.address.city
 *   {{page.title}} → context.page.title
 *   {{tenant.brandName}} → context.tenant.brandName
 *
 * This service has no HTTP calls and no signals — it is safe to use in both
 * the builder canvas (reactive) and the public page renderer (SSR-compatible).
 */
@Injectable({ providedIn: 'root' })
export class TemplateResolverService {
    private readonly TOKEN_PATTERN = /\{\{([^}]+)\}\}/g;

    /**
     * Resolve all bindings in block.bindings against the given context.
     * Returns a new object (shallow copy of block.settings) with bound values overriding
     * the static settings values for the properties that have bindings defined.
     */
    resolve(block: BlockNode, context: TemplateContext): Record<string, unknown> {
        const settings = { ...block.settings };

        if (!block.bindings || Object.keys(block.bindings).length === 0) {
            return settings;
        }

        for (const [settingsPath, tokenString] of Object.entries(block.bindings)) {
            const resolved = this.resolveToken(tokenString, context);
            settings[settingsPath] = resolved;
        }

        return settings;
    }

    /**
     * Resolve a single token string that may contain one or more {{…}} expressions.
     * If the string is a single token with no surrounding text, returns the raw resolved value
     * (preserving type — null, number, etc.).
     * If the string has surrounding text, all tokens are resolved as strings and concatenated.
     */
    resolveToken(tokenString: string, context: TemplateContext): unknown {
        if (!tokenString || typeof tokenString !== 'string') return tokenString;

        // Check for a single pure token (entire string is one {{…}})
        const pureTokenMatch = tokenString.match(/^\{\{([^}]+)\}\}$/);
        if (pureTokenMatch) {
            return this.resolvePath(pureTokenMatch[1].trim(), context);
        }

        // Mixed string — replace all tokens and return concatenated string
        return tokenString.replace(this.TOKEN_PATTERN, (_match, path: string) => {
            const value = this.resolvePath(path.trim(), context);
            return value != null ? String(value) : '';
        });
    }

    /**
     * Walk a dot-separated path through the context object.
     * e.g. "record.dataJson.address.city" → context.record.dataJson.address.city
     * Returns empty string for any missing segment.
     */
    resolvePath(path: string, context: TemplateContext): unknown {
        const parts = path.split('.');
        let current: unknown = context;

        for (const part of parts) {
            if (current == null || typeof current !== 'object') return '';
            current = (current as Record<string, unknown>)[part];
        }

        return current ?? '';
    }
}
