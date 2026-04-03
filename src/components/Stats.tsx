import { Users, FileText, Landmark, TrendingUp, Clock } from 'lucide-react';

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
            color: '#1e40af',
            bgColor: 'rgba(30, 64, 175, 0.12)'
        },
        {
            label: 'Total Value',
            value: formatValue(stats.totalValue),
            icon: <TrendingUp size={18} />,
            color: '#059669',
            bgColor: 'rgba(5, 150, 105, 0.12)'
        },
        {
            label: 'Pending Approval',
            value: stats.pendingCount || 0,
            icon: <Clock size={18} />,
            color: '#d97706',
            bgColor: 'rgba(217, 119, 6, 0.12)',
            highlight: true
        },
        {
            label: 'Departments',
            value: stats.departments,
            icon: <Landmark size={18} />,
            color: '#7c3aed',
            bgColor: 'rgba(124, 58, 237, 0.12)'
        },
        {
            label: 'Organisations',
            value: stats.organisations,
            icon: <Users size={18} />,
            color: '#db2777',
            bgColor: 'rgba(219, 39, 119, 0.12)'
        }
    ];

    return (
        <div className="stats-grid">
            {statItems.map((item, index) => (
                <div 
                    key={index} 
                    className={`stat-card ${item.highlight ? 'highlight' : ''}`}
                    style={{ 
                        '--stat-color': item.color, 
                        '--stat-color-light': item.color,
                        '--stat-bg': item.bgColor 
                    } as React.CSSProperties}
                >
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
                </div>
            ))}
        </div>
    );
}
