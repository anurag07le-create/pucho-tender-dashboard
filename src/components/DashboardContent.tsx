'use client';

import { useState, useEffect } from 'react';
import '@/styles/dashboard.css';
import TenderList from '@/components/TenderList';
import Stats from '@/components/Stats';
import TenderModal from '@/components/TenderModal';
import ThemeToggle from '@/components/ThemeToggle';
import { Search, X, IndianRupee } from 'lucide-react';
import MyRates from '@/components/MyRates';

const FETCH_TENDER_WEBHOOK = 'https://studio.pucho.ai/api/v1/webhooks/Yw3xK4gTp3iNMP59sKuh3';

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
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [tenderIdInput, setTenderIdInput] = useState('');
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [fetchSuccess, setFetchSuccess] = useState(false);
    const [showMyRates, setShowMyRates] = useState(false);

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

    const handleFetchTender = async () => {
        if (!tenderIdInput.trim()) {
            setFetchError('Please enter a Tender ID');
            return;
        }

        setFetchLoading(true);
        setFetchError('');
        setFetchSuccess(false);

        try {
            const response = await fetch(FETCH_TENDER_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenderId: tenderIdInput.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            setFetchSuccess(true);
            setTenderIdInput('');
            setTimeout(() => {
                setShowFetchModal(false);
                setFetchSuccess(false);
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Failed to fetch tender:', error);
            setFetchError('Failed to submit request. Please try again.');
        } finally {
            setFetchLoading(false);
        }
    };

    return (
        <main className="dashboard-container">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <h1>Pushp Infratech</h1>
                    <p>Tender Management System</p>
                </div>
                <div className="header-actions">
                    <span className="badge badge-secondary">
                        Updated: {mounted ? formatDate() : 'Loading...'}
                    </span>
                    <ThemeToggle />
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowMyRates(true)}
                    >
                        <IndianRupee size={16} />
                        My Rates
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowFetchModal(true)}
                    >
                        <Search size={16} />
                        Fetch Tender
                    </button>
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
                    <h2>📋 Active Tenders</h2>
                </div>
                <TenderList tenders={tenders} onSelect={setSelectedTender} />
            </section>

            {/* Tender Modal */}
            {selectedTender && (
                <TenderModal 
                    tender={selectedTender} 
                    onClose={() => setSelectedTender(null)} 
                />
            )}

            {/* Fetch Tender Modal */}
            {showFetchModal && (
                <div className="modal-backdrop" onClick={() => setShowFetchModal(false)}>
                    <div className="fetch-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="fetch-modal-header">
                            <h3>Fetch Tender</h3>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowFetchModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="fetch-modal-content">
                            <label className="fetch-label">Enter Tender ID</label>
                            <input
                                type="text"
                                className="fetch-input"
                                placeholder="e.g., 288545"
                                value={tenderIdInput}
                                onChange={(e) => setTenderIdInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFetchTender()}
                            />
                            {fetchError && <p className="fetch-error">{fetchError}</p>}
                            {fetchSuccess && <p className="fetch-success">✓ Request submitted successfully!</p>}
                        </div>
                        <div className="fetch-modal-footer">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowFetchModal(false)}
                                disabled={fetchLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleFetchTender}
                                disabled={fetchLoading}
                            >
                                {fetchLoading ? 'Fetching...' : 'Fetch Tender'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* My Rates Modal */}
            <MyRates isOpen={showMyRates} onClose={() => setShowMyRates(false)} />
        </main>
    );
}
