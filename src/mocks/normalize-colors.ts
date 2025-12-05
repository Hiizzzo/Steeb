// Mock for @react-native/normalize-colors
// Fixes: "default" is not exported error in production build

const normalizeColor = (color: string | number | null | undefined): number | null => {
    if (color === undefined || color === null) {
        return null;
    }

    if (typeof color === 'number') {
        return color;
    }

    // Simple color parsing for web
    if (typeof color === 'string') {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                const r = parseInt(hex[0] + hex[0], 16);
                const g = parseInt(hex[1] + hex[1], 16);
                const b = parseInt(hex[2] + hex[2], 16);
                return (255 << 24) | (r << 16) | (g << 8) | b;
            }
            if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return (255 << 24) | (r << 16) | (g << 8) | b;
            }
            if (hex.length === 8) {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                const a = parseInt(hex.slice(6, 8), 16);
                return (a << 24) | (r << 16) | (g << 8) | b;
            }
        }

        // Handle named colors (basic)
        const namedColors: Record<string, number> = {
            transparent: 0x00000000,
            black: 0xff000000,
            white: 0xffffffff,
            red: 0xffff0000,
            green: 0xff00ff00,
            blue: 0xff0000ff,
        };

        if (namedColors[color.toLowerCase()]) {
            return namedColors[color.toLowerCase()];
        }
    }

    return null;
};

export default normalizeColor;
export { normalizeColor };
