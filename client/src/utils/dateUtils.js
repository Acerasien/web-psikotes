import { format } from 'date-fns';

/**
 * Convert a UTC ISO string (without timezone) to a formatted local date/time string.
 * @param {string} isoString - e.g., "2025-03-02T12:34:56"
 * @param {string} formatStr - date-fns format string (default: 'dd MMM yyyy HH:mm')
 * @returns {string} formatted local time
 */
export const formatLocalDateTime = (isoString, formatStr = 'dd MMM yyyy HH:mm') => {
    if (!isoString) return '-';
    // Append 'Z' to treat as UTC
    const date = new Date(isoString + 'Z');
    return format(date, formatStr);
};