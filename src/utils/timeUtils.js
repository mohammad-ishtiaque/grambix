/**
 * Parses a duration input (Number or String) into total seconds.
 * Supported string formats: "HH:MM:SS", "MM:SS", "SS"
 * Examples: 
 * "01:30:00" -> 5400
 * "10:00" -> 600
 * @param {string|number} input 
 * @returns {number} duration in seconds
 */
const parseDurationToSeconds = (input) => {
    if (typeof input === 'number') {
        return input;
    }

    if (!input || typeof input !== 'string') {
        return 0;
    }

    const parts = input.split(':').map(Number);
    
    if (parts.some(isNaN)) {
        return 0; // Invalid format fallback
    }

    if (parts.length === 3) {
        // HH:MM:SS
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return (parts[0] * 60) + parts[1];
    } else if (parts.length === 1) {
        // SS
        return parts[0];
    }

    return 0;
};

module.exports = { parseDurationToSeconds };
