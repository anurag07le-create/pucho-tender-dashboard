'use client';

import { useState } from 'react';
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

    return (
        <main className="dashboard-container animate-fade-in">
            <header className="header">
                <div>
                    <h1>Tender Dashboard</h1>
                    <p>Monitoring {stats.totalTenders} active tender opportunities</p>
                </div>
                <div className="header-actions">
                    <span className="badge badge-secondary">Last updated: {new Date().toLocaleDateString()}</span>
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Data
                    </button>
                </div>
            </header>

            <Stats stats={stats} />

            <section className="content-section">
                <div className="section-header">
                    <h2>Recent Tenders</h2>
                </div>
                <TenderList tenders={tenders} onSelect={setSelectedTender} />
            </section>

            {selectedTender && (
                <TenderModal 
                    tender={selectedTender} 
                    onClose={() => setSelectedTender(null)} 
                />
            )}
        </main>
    );
}
