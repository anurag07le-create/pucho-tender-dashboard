'use client';

import { useState, useEffect } from 'react';
import '@/styles/dashboard.css';
import TenderList from '@/components/TenderList';
import Stats from '@/components/Stats';
import TenderModal from '@/components/TenderModal';

interface DashboardContentProps {
    tenders: any[];
    stats: {
        totalTenders: number;
        totalValue: number;
        departments: number;
        organisations: number;
        withEligibility?: number;
    };
}

export default function DashboardContent({ tenders, stats }: DashboardContentProps) {
    const [selectedTender, setSelectedTender] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatDate = () => {
        const date = new Date();
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <main className="dashboard-container">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <h1>Tender Dashboard</h1>
                    <p>Monitoring {stats.totalTenders} active tender opportunities</p>
                </div>
                <div className="header-actions">
                    <span className="badge badge-secondary">
                        Updated: {mounted ? formatDate() : 'Loading...'}
                    </span>
                    <button 
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        ↻ Refresh
                    </button>
                </div>
            </header>

            {/* Stats */}
            <Stats stats={stats} />

            {/* Tenders Table */}
            <section className="content-section">
                <div className="section-header">
                    <h2>📋 Recent Tenders</h2>
                </div>
                <TenderList tenders={tenders} onSelect={setSelectedTender} />
            </section>

            {/* Modal */}
            {selectedTender && (
                <TenderModal 
                    tender={selectedTender} 
                    onClose={() => setSelectedTender(null)} 
                />
            )}
        </main>
    );
}
