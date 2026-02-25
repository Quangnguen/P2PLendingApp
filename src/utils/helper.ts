export const getRatingColor = (rating: string) => {
    switch (rating) {
        case 'EXCELLENT': return 'rgba(34, 197, 94, 0.2)';
        case 'GOOD': return 'rgba(59, 130, 246, 0.2)';
        case 'FAIR': return 'rgba(251, 191, 36, 0.2)';
        default: return 'rgba(239, 68, 68, 0.2)';
    }
};