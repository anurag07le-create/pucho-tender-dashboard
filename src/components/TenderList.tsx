'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronDown, Eye } from 'lucide-react';

interface TenderListProps {
    tenders: any[];
    onSelect: (tender: any) => void;
}

const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'open') return 'badge-success';
    if (s === 'accepted') return 'badge-accepted';
    if (s === 'rejected') return 'badge-rejected';
    return 'badge-warning';
};

const getStatusCardClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'open') return 'open';
    if (s === 'accepted') return 'accepted';
    if (s === 'rejected') return 'rejected';
    return 'pending';
};

// Format number in Indian system (e.g., 2308802.37 -> 23,08,802.37)
const formatIndianNumber = (num: number) => {
    const intPart = Math.floor(num);
    const decPart = num % 1;
    
    let intStr = intPart.toString();
    let result = '';
    
    let i = intStr.length - 1;
    let count = 0;
    
    while (i >= 0) {
        result = intStr[i] + result;
        count++;
        i--;
        
        // First comma after 3 digits from right, then after every 2
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
    
    // Add decimal part if exists
    if (decPart > 0) {
        result += '.' + decPart.toFixed(2).split('.')[1];
    }
    
    return result;
};

// Parse and format estimated cost
const formatEstimatedCost = (costStr: string) => {
    if (!costStr || costStr === '0.00 INR.') return { value: 'N/A', suffix: '' };
    
    // Extract numeric value
    const match = costStr.match(/[\d,]+\.?\d*/);
    if (!match) {
        const parts = costStr.split('INR');
        return { value: parts[0]?.trim() || 'N/A', suffix: 'INR' };
    }
    
    const numValue = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(numValue) || numValue === 0) {
        const parts = costStr.split('INR');
        return { value: parts[0]?.trim() || 'N/A', suffix: 'INR' };
    }
    
    // Format in Indian system
    const formatted = formatIndianNumber(numValue);
    
    return { value: formatted, suffix: 'INR' };
};

export default function TenderList({ tenders, onSelect }: TenderListProps) {
    const [localTenders, setLocalTenders] = useState(tenders);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState<string | null>(null);
    const [placeFilter, setPlaceFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [classFilter, setClassFilter] = useState<string | null>(null);
    const [valueMin, setValueMin] = useState('');
    const [valueMax, setValueMax] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const extractClass = (tender: any): string | null => {
        const eligibility = tender.eligibilityCriteria || [];
        const invalidWords = ['OR', 'AND', 'NOT', 'THE', 'FOR', 'CLASS', 'ABOVE', 'BELOW'];
        for (const section of eligibility) {
            if (section.items) {
                for (const item of section.items) {
                    if (item.label?.toLowerCase().includes('registration class') || item.label?.toLowerCase().includes('class')) {
                        const value = item.value || '';
                        const matches = value.match(/\b([A-Za-z][0-9]?-[0-9]+|[A-Za-z][0-9]?)\b/g);
                        if (matches) {
                            for (const match of matches) {
                                const cleanMatch = match.toUpperCase();
                                if (!invalidWords.includes(cleanMatch) && cleanMatch.length <= 4) {
                                    return cleanMatch;
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    };

    const classes = useMemo(() => {
        const classSet = new Set<string>();
        tenders.forEach(t => {
            const cls = extractClass(t);
            if (cls) classSet.add(cls);
        });
        return Array.from(classSet).sort();
    }, [localTenders]);

    const departments = useMemo(() => {
        const depts = [...new Set(localTenders.map(t => t.department))].filter(Boolean);
        return depts.sort();
    }, [localTenders]);

    const places = useMemo(() => {
        const locs = [...new Set(localTenders.map(t => t.rawData?.Location).filter(Boolean))];
        return locs.sort().slice(0, 20);
    }, [localTenders]);

    const statuses = ['Open', 'Pending', 'Accepted', 'Rejected'];

    const filtered = useMemo(() => {
        return localTenders.filter(t => {
            const searchLower = search.toLowerCase();
            const matchesSearch = !search || 
                t.id?.toString().toLowerCase().includes(searchLower) ||
                t.name?.toLowerCase().includes(searchLower) ||
                t.organisation?.toLowerCase().includes(searchLower) ||
                t.rawData?.['Description of Material/Name of Work']?.toLowerCase().includes(searchLower);

            const matchesDept = !deptFilter || t.department === deptFilter;
            const matchesPlace = !placeFilter || t.rawData?.Location === placeFilter;
            const matchesStatus = !statusFilter || t.status?.toLowerCase() === statusFilter.toLowerCase();
            
            const matchesClass = !classFilter || extractClass(t) === classFilter;

            let matchesValue = true;
            if (valueMin || valueMax) {
                const costStr = t.estimatedCost || '0';
                const value = parseFloat(costStr.replace(/[^0-9.]/g, '')) || 0;
                if (valueMin && value < parseFloat(valueMin)) matchesValue = false;
                if (valueMax && value > parseFloat(valueMax)) matchesValue = false;
            }

            return matchesSearch && matchesDept && matchesPlace && matchesStatus && matchesClass && matchesValue;
        });
    }, [localTenders, search, deptFilter, placeFilter, statusFilter, classFilter, valueMin, valueMax]);

    useEffect(() => {
        setLocalTenders(tenders);
    }, [tenders]);

    useEffect(() => {
        const handleUpdate = (event: any) => {
            const updatedTender = event.detail;
            setLocalTenders(prev => prev.map(t => t.id === updatedTender.id ? updatedTender : t));
        };
        window.addEventListener('tender-status-updated', handleUpdate as EventListener);
        return () => window.removeEventListener('tender-status-updated', handleUpdate as EventListener);
    }, []);

    const clearFilters = () => {
        setSearch('');
        setDeptFilter(null);
        setPlaceFilter(null);
        setStatusFilter(null);
        setClassFilter(null);
        setValueMin('');
        setValueMax('');
    };

    const hasActiveFilters = search || deptFilter || placeFilter || statusFilter || classFilter || valueMin || valueMax;

    return (
        <div>
            {/* Filters */}
            <div className="filters-container">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by tender name, ID, or organisation..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="filters-row">
                    {/* Department Filter */}
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="filter-btn"
                            onClick={() => setOpenDropdown(openDropdown === 'dept' ? null : 'dept')}
                        >
                            <span>{deptFilter || 'Department'}</span>
                            <ChevronDown size={16} />
                        </button>
                        {openDropdown === 'dept' && (
                            <div className="filter-dropdown">
                                {departments.map(dept => (
                                    <div
                                        key={dept}
                                        className={`filter-option ${deptFilter === dept ? 'selected' : ''}`}
                                        onClick={() => {
                                            setDeptFilter(deptFilter === dept ? null : dept);
                                            setOpenDropdown(null);
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
                            onClick={() => setOpenDropdown(openDropdown === 'place' ? null : 'place')}
                        >
                            <span>{placeFilter || 'Place'}</span>
                            <ChevronDown size={16} />
                        </button>
                        {openDropdown === 'place' && (
                            <div className="filter-dropdown">
                                {places.map(place => (
                                    <div
                                        key={place}
                                        className={`filter-option ${placeFilter === place ? 'selected' : ''}`}
                                        onClick={() => {
                                            setPlaceFilter(placeFilter === place ? null : place);
                                            setOpenDropdown(null);
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
                            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                        >
                            <span>{statusFilter || 'Status'}</span>
                            <ChevronDown size={16} />
                        </button>
                        {openDropdown === 'status' && (
                            <div className="filter-dropdown">
                                {statuses.map(status => (
                                    <div
                                        key={status}
                                        className={`filter-option ${statusFilter === status ? 'selected' : ''}`}
                                        onClick={() => {
                                            setStatusFilter(statusFilter === status ? null : status);
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {status}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Class Filter */}
                    {classes.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <button 
                                className="filter-btn"
                                onClick={() => setOpenDropdown(openDropdown === 'class' ? null : 'class')}
                            >
                                <span>{classFilter ? `Class ${classFilter}` : 'Class'}</span>
                                <ChevronDown size={16} />
                            </button>
                            {openDropdown === 'class' && (
                                <div className="filter-dropdown">
                                    {classes.map(cls => (
                                        <div
                                            key={cls}
                                            className={`filter-option ${classFilter === cls ? 'selected' : ''}`}
                                            onClick={() => {
                                                setClassFilter(classFilter === cls ? null : cls);
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            Class {cls}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Value Filter */}
                    <div className="value-filter">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Value ₹:</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={valueMin}
                            onChange={(e) => setValueMin(e.target.value)}
                        />
                        <span style={{ color: 'var(--border)' }}>—</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={valueMax}
                            onChange={(e) => setValueMax(e.target.value)}
                        />
                    </div>

                    {hasActiveFilters && (
                        <button className="clear-filters" onClick={clearFilters}>
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Table - Desktop */}
            <div className="tender-table-wrapper">
                <table className="tender-table">
                    <thead>
                        <tr>
                            <th style={{ width: '100px' }}>ID</th>
                            <th>Tender Name</th>
                            <th>Organisation</th>
                            <th style={{ width: '100px' }}>Status</th>
                            <th style={{ width: '120px' }}>Due Date</th>
                            <th style={{ width: '140px' }}>Value</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state">
                                        No tenders found matching your criteria.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((tender, index) => (
                                <tr key={`${tender.id}-${index}`}>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{tender.id}</td>
                                    <td>
                                        <div 
                                            style={{ 
                                                maxWidth: '300px', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                whiteSpace: 'nowrap',
                                                fontWeight: 500
                                            }}
                                            title={tender.rawData?.['Description of Material/Name of Work'] || tender.name}
                                        >
                                            {tender.rawData?.['Description of Material/Name of Work'] || tender.name || 'Untitled Tender'}
                                        </div>
                                    </td>
                                    <td>{tender.organisation}</td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(tender.status)}`}>
                                            {tender.status || 'Open'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-secondary">
                                            {tender.submissionDate?.split(' ')[0]}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>
                                        {(() => {
                                            const { value, suffix } = formatEstimatedCost(tender.estimatedCost);
                                            return (
                                                <>
                                                    {value}
                                                    {suffix && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> {suffix}</span>}
                                                </>
                                            );
                                        })()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            className="view-btn"
                                            onClick={() => onSelect(tender)}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-tender-cards">
                {filtered.length === 0 ? (
                    <div className="empty-state">No tenders found matching your criteria.</div>
                ) : (
                    filtered.map((tender, index) => (
                        <div key={`${tender.id}-${index}`} className="tender-card">
                            <div className="tender-card-header">
                                <span className="tender-card-id">#{tender.id}</span>
                                <span className={`tender-card-status ${getStatusCardClass(tender.status)}`}>
                                    {tender.status || 'Open'}
                                </span>
                            </div>
                            <div className="tender-card-title">
                                {tender.rawData?.['Description of Material/Name of Work'] || tender.name || 'Untitled Tender'}
                            </div>
                            <div className="tender-card-org">{tender.organisation}</div>
                            <div className="tender-card-details">
                                <div className="tender-card-detail-item">
                                    <span className="tender-card-detail-label">Due Date</span>
                                    <span className="tender-card-detail-value">{tender.submissionDate?.split(' ')[0] || 'N/A'}</span>
                                </div>
                                <div className="tender-card-detail-item">
                                    <span className="tender-card-detail-label">Value</span>
                                    <span className="tender-card-detail-value">
                                        {formatEstimatedCost(tender.estimatedCost).value} {formatEstimatedCost(tender.estimatedCost).suffix}
                                    </span>
                                </div>
                                <div className="tender-card-detail-item">
                                    <span className="tender-card-detail-label">Department</span>
                                    <span className="tender-card-detail-value">{tender.department || 'N/A'}</span>
                                </div>
                                <div className="tender-card-detail-item">
                                    <span className="tender-card-detail-label">Place</span>
                                    <span className="tender-card-detail-value">{tender.rawData?.Location || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="tender-card-footer">
                                <button className="tender-card-view-btn" onClick={() => onSelect(tender)}>
                                    <Eye size={14} /> View Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
