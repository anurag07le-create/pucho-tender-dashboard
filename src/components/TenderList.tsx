'use client';

import { useState } from 'react';
import { Search, Eye, Filter } from 'lucide-react';

export default function TenderList({ tenders, onSelect }: { tenders: any[], onSelect: (tender: any) => void }) {
    const [search, setSearch] = useState('');

    const filtered = tenders.filter(t => 
        t.organisation.toLowerCase().includes(search.toLowerCase()) ||
        t.department.toLowerCase().includes(search.toLowerCase()) ||
        t.subDepartment.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="section-header">
                <div style={{ position: 'relative' }}>
                    <Search className="search-icon" size={16} />
                    <input 
                        className="search-input" 
                        placeholder="Search by organisation, department..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
                <button className="filter-btn">
                    <Filter size={18} />
                    <span>Filter</span>
                </button>
            </div>
            <div className="tender-table-wrapper">
                <table className="tender-table">
                    <thead>
                        <tr>
                            <th>Tender ID</th>
                            <th>Organisation</th>
                            <th>Department</th>
                            <th>Due Date</th>
                            <th>Value</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((tender) => (
                            <tr key={tender.id}>
                                <td style={{ fontWeight: 600 }}>#{tender.id}</td>
                                <td>{tender.organisation}</td>
                                <td>{tender.department}</td>
                                <td>
                                    <span className="badge badge-secondary">
                                        {tender.submissionDate?.split(' ')[0]}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                    {tender.estimatedCost.split('INR')[0]} <span style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>INR</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        className="view-btn" 
                                        onClick={() => onSelect(tender)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Eye size={14} /> Full View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                }
                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-main);
                }
            `}</style>
        </>
    );
}
