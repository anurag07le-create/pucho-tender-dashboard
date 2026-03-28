import tenders from '@/data/tenders.json';

export const getTenders = () => tenders;

export const getStats = () => {
    const totalTenders = tenders.length;
    const totalValue = tenders.reduce((acc, t) => {
        const costStr = t.estimatedCost || '0';
        const value = parseFloat(costStr.replace(/[^0-9.]/g, '')) || 0;
        return acc + value;
    }, 0);
    
    const departments = [...new Set(tenders.map(t => t.department))].length;
    const organisations = [...new Set(tenders.map(t => t.organisation))].length;

    return {
        totalTenders,
        totalValue,
        departments,
        organisations
    };
};

export const getDepartmentData = () => {
    const counts: Record<string, number> = {};
    tenders.forEach(t => {
        counts[t.department] = (counts[t.department] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
};
