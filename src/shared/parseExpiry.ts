export const parseExpiry = (expiresIn: string | number) => {
    if (!expiresIn) {
        console.warn("EXPIRES_IN is empty. Using default value of 10 minutes.");
        return 10 * 60 * 1000; // Default to 10 minutes
    }

    if (typeof expiresIn === "number") {
        return expiresIn * 1000; // Assume it's in seconds and convert to milliseconds
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error("Invalid EXPIRES_IN format. Use a format like '10m', '1h', '7d'.");
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case "s": return value * 1000;
        case "m": return value * 60 * 1000;
        case "h": return value * 60 * 60 * 1000;
        case "d": return value * 24 * 60 * 60 * 1000;
        default: throw new Error("Unsupported time unit in EXPIRES_IN");
    }
};
