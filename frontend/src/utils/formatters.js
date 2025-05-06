export const formatDateTime = (isoString, includeTime = true) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false }; // Use false for 24-hour format if preferred

        const datePart = date.toLocaleDateString(undefined, optionsDate);
        const timePart = includeTime ? date.toLocaleTimeString(undefined, optionsTime) : '';

        return includeTime ? `${datePart}, ${timePart}` : datePart;
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Date Error';
    }
};

export const truncateContent = (content, maxLength = 50) => {
    if (!content) return '';
    if (content.length <= maxLength) {
        return content;
    }
    return content.substring(0, maxLength) + '...';
}; 