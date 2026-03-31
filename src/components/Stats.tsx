import { Users, FileText, Landmark, TrendingUp, Award } from 'lucide-react';

export default function Stats({ stats }: { stats: any }) {
    return (
        <div className="stats-grid">
            <StatCard 
                label="Total Tenders" 
                value={stats.totalTenders} 
                icon={<FileText size={20} />} 
                color="var(--primary)"
            />
            <StatCard 
                label="Total Value" 
                value={`₹ ${(stats.totalValue / 10000000).toFixed(2)} Cr`} 
                icon={<TrendingUp size={20} />} 
                color="var(--success)"
            />
            <StatCard 
                label="Departments" 
                value={stats.departments} 
                icon={<Landmark size={20} />} 
                color="var(--warning)"
            />
            <StatCard 
                label="Organisations" 
                value={stats.organisations} 
                icon={<Users size={20} />} 
                color="#8b5cf6"
            />
            <StatCard 
                label="With Eligibility Criteria" 
                value={stats.withEligibility || 0} 
                icon={<Award size={20} />} 
                color="#ec4899"
            />
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="stat-card">
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="stat-label">{label}</span>
                <div style={{ color: color, background: `${color}10`, padding: '0.4rem', borderRadius: '8px' }}>
                    {icon}
                </div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-change" style={{ color: 'var(--success)' }}>
                <span>+ 12.5%</span> 
                <span style={{ color: 'var(--text-muted)' }}>from last month</span>
            </div>
        </div>
    );
}
