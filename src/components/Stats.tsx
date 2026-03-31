import { Users, FileText, Landmark, TrendingUp, Award } from 'lucide-react';

// Format number in Indian system
const formatIndianNumber = (num: number) => {
    const intPart = Math.floor(num);
    const intStr = intPart.toString();
    let result = '';
    
    let i = intStr.length - 1;
    let count = 0;
    
    while (i >= 0) {
        result = intStr[i] + result;
        count++;
        i--;
        
        if (i >= 0) {
            if (count === 3) {
                result = ',' + result;
                count = 0;
            } else if (count === 2 && result.includes(',')) {
                result = ',' + result;
                count = 0;
            }
        }
    }
    
    return result;
};

export default function Stats({ stats }: { stats: any }) {
    const formatValue = (value: number) => {
        if (value >= 10000000) {
            const cr = value / 10000000;
            return `₹ ${formatIndianNumber(Math.round(cr * 100) / 100)} Cr`;
        } else if (value >= 100000) {
            const l = value / 100000;
            return `₹ ${formatIndianNumber(Math.round(l * 100) / 100)} L`;
        }
        return `₹ ${formatIndianNumber(value)}`;
    };

    const statItems = [
        {
            label: 'Total Tenders',
            value: stats.totalTenders,
            icon: <FileText size={18} />,
            color: '#4f46e5',
            bgColor: '#eef2ff'
        },
        {
            label: 'Total Value',
            value: formatValue(stats.totalValue),
            icon: <TrendingUp size={18} />,
            color: '#10b981',
            bgColor: '#d1fae5'
        },
        {
            label: 'Departments',
            value: stats.departments,
            icon: <Landmark size={18} />,
            color: '#f59e0b',
            bgColor: '#fef3c7'
        },
        {
            label: 'Organisations',
            value: stats.organisations,
            icon: <Users size={18} />,
            color: '#8b5cf6',
            bgColor: '#ede9fe'
        },
        {
            label: 'With Eligibility',
            value: stats.withEligibility || stats.totalTenders,
            icon: <Award size={18} />,
            color: '#ec4899',
            bgColor: '#fce7f3'
        }
    ];

    return (
        <div className="stats-grid">
            {statItems.map((item, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">{item.label}</span>
                        <div 
                            className="stat-icon"
                            style={{ 
                                background: item.bgColor,
                                color: item.color
                            }}
                        >
                            {item.icon}
                        </div>
                    </div>
                    <div className="stat-value">{item.value}</div>
                    <div className="stat-change positive">
                        <span>↑ 12.5%</span>
                        <span style={{ color: 'var(--text-muted)' }}>from last month</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
