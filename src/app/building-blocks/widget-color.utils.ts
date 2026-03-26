/**
 * Converts a hex color string and an opacity value to an rgba() CSS string.
 *
 * @param hex     - Hex color, e.g. '#ffffff' or 'ffffff' (with or without #)
 * @param opacity - Opacity between 0 (fully transparent) and 1 (fully opaque). Default 1.
 * @returns       - A valid CSS rgba() string, e.g. 'rgba(255, 255, 255, 0.5)'
 *                  Falls back to the original hex value if parsing fails.
 */
export function hexToRgba(hex: string, opacity: number = 1): string {
    if (!hex) return `rgba(0,0,0,${opacity})`;

    // Strip leading '#'
    const clean = hex.replace(/^#/, '');

    let r: number, g: number, b: number;

    if (clean.length === 3) {
        // Short form #abc → #aabbcc
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
        r = parseInt(clean.slice(0, 2), 16);
        g = parseInt(clean.slice(2, 4), 16);
        b = parseInt(clean.slice(4, 6), 16);
    } else {
        // Unrecognised format — return the hex as-is
        return hex;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

    const alpha = Math.min(1, Math.max(0, opacity ?? 1));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
