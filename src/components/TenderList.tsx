'use client';

import { useState, useMemo } from 'react';
import { Search, Eye, Filter, ChevronDown } from 'lucide-react';

export default function TenderList({ tenders, onSelect }: { tenders: any[], onSelect: (tender: any) => void }) {
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [selectedPlace, setSelectedPlace] = useState('All Places');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [minValue, setMinValue] = useState<string>('');
    const [maxValue, setMaxValue] = useState<string>('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isPlaceFilterOpen, setIsPlaceFilterOpen] = useState(false);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

    // Get unique departments for the filter
    const departments = useMemo(() => {
        const depts = new Set(tenders.map(t => t.department).filter(Boolean));
        return ['All Departments', ...Array.from(depts).sort()];
    }, [tenders]);

    // Get unique places (locations)
    const places = useMemo(() => {
        const locs = new Set(tenders.map(t => t.rawData?.["Location"]).filter(Boolean));
        return ['All Places', ...Array.from(locs).sort()];
    }, [tenders]);

    // Get unique statuses
    const statuses = useMemo(() => {
        const stats = new Set(tenders.map(t => t.status).filter(Boolean));
        return ['All Status', ...Array.from(stats).sort()];
    }, [tenders]);

    const filtered = useMemo(() => {
        return tenders.filter(t => {
            const searchLower = search.toLowerCase();
            const matchesSearch = 
                (t.rawData?.["Description of Material/Name of Work"] || '').toLowerCase().includes(searchLower) ||
                (t.rawData?.["Tender title/Name Of Project"] || '').toLowerCase().includes(searchLower) ||
                (t.organisation || '').toLowerCase().includes(searchLower) ||
                (t.department || '').toLowerCase().includes(searchLower) ||
                (t.subDepartment || '').toLowerCase().includes(searchLower) ||
                (t.rawData?.["Location"] || '').toLowerCase().includes(searchLower) ||
                (t.rawData?.["Address"] || '').toLowerCase().includes(searchLower) ||
                (t.id || '').toString().includes(searchLower);
            
            const matchesDept = selectedDept === 'All Departments' || t.department === selectedDept;
            const matchesPlace = selectedPlace === 'All Places' || t.rawData?.["Location"] === selectedPlace;
            const matchesStatus = selectedStatus === 'All Status' || t.status === selectedStatus;
            
            // Numeric value filtering
            const costValue = parseFloat(t.estimatedCost?.replace(/[^\d.]/g, '') || '0') || 0;
            const matchesMin = !minValue || costValue >= parseFloat(minValue);
            const matchesMax = !maxValue || costValue <= parseFloat(maxValue);
            
            return matchesSearch && matchesDept && matchesPlace && matchesStatus && matchesMin && matchesMax;
        });
    }, [tenders, search, selectedDept, selectedPlace, selectedStatus, minValue, maxValue]);

    return (
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div className="section-header" style={{ marginBottom: '1rem', gap: '1rem', borderTop: 'none', padding: '1rem 0' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search className="search-icon" size={16} />
                    <input 
                        className="search-input" 
                        placeholder="Search by tender name, ID, or organisation..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%', maxWidth: 'none' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                {/* Department Filter */}
                <div style={{ position: 'relative' }}>
                    <button 
                        className="filter-btn" 
                        onClick={() => { setIsFilterOpen(!isFilterOpen); setIsPlaceFilterOpen(false); }}
                        style={{ 
                            background: selectedDept !== 'All Departments' ? 'var(--primary-light)' : 'transparent',
                            width: '220px',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={16} />
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedDept === 'All Departments' ? 'Department' : selectedDept}</span>
                        </div>
                        <ChevronDown size={14} style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    
                    {isFilterOpen && (
                        <div className="filter-dropdown" style={{ zIndex: 200, left: 0, right: 'auto' }}>
                            {departments.map(dept => (
                                <div 
                                    key={dept} 
                                    className={`filter-item ${selectedDept === dept ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedDept(dept);
                                        setIsFilterOpen(false);
                                    }}
                                >
                                    {dept}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Place Filter */}
                <div style={{ position: 'relative' }}>
                    <button 
                        className="filter-btn" 
                        onClick={() => { setIsPlaceFilterOpen(!isPlaceFilterOpen); setIsFilterOpen(false); }}
                        style={{ 
                            background: selectedPlace !== 'All Places' ? 'var(--primary-light)' : 'transparent',
                            width: '180px',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={16} />
                            <span>{selectedPlace === 'All Places' ? 'Place' : selectedPlace}</span>
                        </div>
                        <ChevronDown size={14} style={{ transform: isPlaceFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    
                    {isPlaceFilterOpen && (
                        <div className="filter-dropdown" style={{ zIndex: 200, left: 0, right: 'auto' }}>
                            {places.map(place => (
                                <div 
                                    key={place} 
                                    className={`filter-item ${selectedPlace === place ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedPlace(place);
                                        setIsPlaceFilterOpen(false);
                                    }}
                                >
                                    {place}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div style={{ position: 'relative' }}>
                    <button 
                        className="filter-btn" 
                        onClick={() => { setIsStatusFilterOpen(!isStatusFilterOpen); setIsFilterOpen(false); setIsPlaceFilterOpen(false); }}
                        style={{ 
                            background: selectedStatus !== 'All Status' ? 'var(--primary-light)' : 'transparent',
                            width: '150px',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={16} />
                            <span>{selectedStatus === 'All Status' ? 'Status' : selectedStatus}</span>
                        </div>
                        <ChevronDown size={14} style={{ transform: isStatusFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    
                    {isStatusFilterOpen && (
                        <div className="filter-dropdown" style={{ zIndex: 200, left: 0, right: 'auto' }}>
                            {statuses.map(status => (
                                <div 
                                    key={status} 
                                    className={`filter-item ${selectedStatus === status ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedStatus(status);
                                        setIsStatusFilterOpen(false);
                                    }}
                                >
                                    {status}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Value Range Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VALUE INR:</span>
                    <input 
                        type="number" 
                        placeholder="Min" 
                        className="search-input" 
                        style={{ width: '100px', padding: '4px 8px' }} 
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                    />
                    <span style={{ color: 'var(--border)' }}>-</span>
                    <input 
                        type="number" 
                        placeholder="Max" 
                        className="search-input" 
                        style={{ width: '120px', padding: '4px 8px' }} 
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                    />
                </div>

                <button 
                    onClick={() => {
                        setSearch('');
                        setSelectedDept('All Departments');
                        setSelectedPlace('All Places');
                        setSelectedStatus('All Status');
                        setMinValue('');
                        setMaxValue('');
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    Clear All
                </button>
            </div>
            
            <div className="tender-table-wrapper">
                <table className="tender-table">
                    <thead>
                        <tr>
                            <th style={{ width: '120px' }}>Tender ID</th>
                            <th>Tender Name</th>
                            <th>Organisation</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Value</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No tenders found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((tender) => (
                                <tr key={tender.id}>
                                    <td style={{ fontWeight: 600 }}>#{tender.id}</td>
                                    <td>
                                        <div style={{ 
                                            maxWidth: '280px', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap',
                                            fontWeight: 500
                                        }} title={tender.rawData?.["Description of Material/Name of Work"] || tender.name}>
                                            {tender.rawData?.["Description of Material/Name of Work"] || tender.name || 'Untitled Tender'}
                                        </div>
                                    </td>
                                    <td>{tender.organisation}</td>
                                    <td>
                                        <span className={`badge ${tender.status?.toLowerCase() === 'open' ? 'badge-success' : tender.status?.toLowerCase() === 'closed' ? 'badge-secondary' : 'badge-warning'}`}>
                                            {tender.status || 'Open'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-secondary">
                                            {tender.submissionDate?.split(' ')[0]}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {tender.estimatedCost.split('INR')[0] || 'N/A'} <span style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>INR</span>
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
                            ))
                        )}
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
                    z-index: 1;
                }
                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-main);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                }
                .filter-btn:hover {
                    border-color: var(--primary);
                    background: var(--bg-hover);
                }
                .filter-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 280px;
                    max-height: 400px;
                    overflow-y: auto;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    box-shadow: var(--shadow-lg);
                    z-index: 100;
                    padding: 0.5rem;
                }
                .filter-item {
                    padding: 0.625rem 0.875rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .filter-item:hover {
                    background: var(--bg-hover);
                }
                .filter-item.active {
                    background: var(--primary-light);
                    color: var(--primary);
                    font-weight: 600;
                }
                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
