'use client';

import { useState } from 'react';
import { getTenders, getStats } from '@/lib/data-provider';
import '@/styles/dashboard.css';
import TenderList from '@/components/TenderList';
import Stats from '@/components/Stats';
import TenderModal from '@/components/TenderModal';

export default function Dashboard() {
    const tenders = getTenders();
    const stats = getStats();
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
