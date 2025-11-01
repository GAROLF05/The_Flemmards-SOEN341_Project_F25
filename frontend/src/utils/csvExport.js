/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Array of column definitions [{key: 'name', label: 'Name'}, ...]
 * @returns {string} CSV string
 */
export const convertToCSV = (data, columns) => {
    if (!data || data.length === 0) {
        return '';
    }

    // Create header row
    const headers = columns.map(col => col.label || col.key);
    const headerRow = headers.join(',');

    // Create data rows
    const dataRows = data.map(item => {
        return columns.map(col => {
            const value = item[col.key] || '';
            // Escape commas and quotes, wrap in quotes if contains comma, quote, or newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });

    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Filename for the downloaded file
 */
export const downloadCSV = (csvContent, filename) => {
    // Add BOM for UTF-8 to ensure proper Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
};

/**
 * Export attendees to CSV
 * @param {Array} attendees - Array of attendee objects
 * @param {Object} eventInfo - Event information object with title, date, etc.
 */
export const exportAttendeesToCSV = (attendees, eventInfo = {}) => {
    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'username', label: 'Username' }
    ];

    const csvContent = convertToCSV(attendees, columns);
    
    // Create filename from event title
    const eventTitle = eventInfo.title || 'Event';
    const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = eventInfo.start_at 
        ? new Date(eventInfo.start_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
    const filename = `attendees_${sanitizedTitle}_${dateStr}.csv`;
    
    downloadCSV(csvContent, filename);
};

