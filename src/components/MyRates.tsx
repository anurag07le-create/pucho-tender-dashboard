'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Search, IndianRupee, Package, Layers3, ArrowUpDown } from 'lucide-react';

const SPREADSHEET_ID = '1ptc1ghEt0ln6koH5aS-qeEP6-Ici2hfEAoVXdQJ3eik';

const WORKSHEETS = [
    { gid: '0', name: 'Basic Rates', kind: 'basic' },
    { gid: '376944045', name: 'Non Basic Rates', kind: 'basic' },
    { gid: '109518457', name: 'Cement Mortar', kind: 'mortar' },
    { gid: '1076274399', name: 'Red Concrete Cement', kind: 'concrete' },
    { gid: '1322055479', name: 'Labor Rates', kind: 'labor' },
] as const;

type WorksheetKind = (typeof WORKSHEETS)[number]['kind'];

interface RateItem {
    id: number;
    name: string;
    unit: string;
    rate: number;
    remarks: string;
    sheetName: string;
    kind: WorksheetKind;
    meta?: string;
}

const formatIndianNumber = (num: number): string => {
    const [intPart, decimalPart] = Math.abs(num).toString().split('.');
    const lastThree = intPart.slice(-3);
    const otherNumbers = intPart.slice(0, -3);
    const formatted = otherNumbers ? `${otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}` : lastThree;
    return `${num < 0 ? '-' : ''}${decimalPart ? `${formatted}.${decimalPart}` : formatted}`;
};

const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
};

const toTitle = (value: string) => value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const classifyRow = (kind: WorksheetKind, columns: string[], rowIndex: number) => {
    const first = columns[0] || '';
    const second = columns[1] || '';
    const third = columns[2] || '';
    const fourth = columns[3] || '';

    if (kind === 'labor') {
        return {
            name: second || `Grade ${first}`,
            unit: third || 'Rate',
            rate: parseFloat((fourth || third || '0').replace(/,/g, '')) || 0,
            remarks: columns.slice(4).filter(Boolean).join(' '),
            meta: `Grade ${second || first}`,
        };
    }

    if (kind === 'mortar' || kind === 'concrete') {
        return {
            name: second || columns.find((cell) => cell) || 'Material Mix',
            unit: third || 'Unit',
            rate: parseFloat((columns[columns.length - 1] || fourth || '0').replace(/,/g, '')) || 0,
            remarks: columns.slice(4, -1).filter(Boolean).join(' '),
            meta: first ? `Row ${first}` : `Row ${rowIndex}`,
        };
    }

    return {
        name: second || 'Unknown',
        unit: third || 'N/A',
        rate: parseFloat((fourth || '0').replace(/,/g, '')) || 0,
        remarks: columns.slice(4).join(' '),
        meta: first ? `Sr. ${first}` : `Row ${rowIndex}`,
    };
};

const buildSummary = (rates: RateItem[]) => ({
    totalMaterials: rates.length,
    totalRate: rates.reduce((sum, item) => sum + item.rate, 0),
    worksheets: new Set(rates.map((item) => item.sheetName)).size,
});

export default function MyRates({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [rates, setRates] = useState<RateItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedSheet, setSelectedSheet] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'rate'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        if (isOpen) fetchRates();
    }, [isOpen]);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const sheetResults = await Promise.all(WORKSHEETS.map(async (sheet) => {
                const response = await fetch(
                    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${sheet.gid}`,
                    { cache: 'no-store' }
                );

                if (!response.ok) throw new Error(`Failed to fetch ${sheet.name}`);

                return { sheet, text: await response.text() };
            }));

            const parsed: RateItem[] = [];

            sheetResults.forEach(({ sheet, text }) => {
                const lines = text.split(/\r?\n/).filter(Boolean);
                const headers = parseCSVLine(lines[0] || '').map((cell) => cell.toLowerCase());
                const rateIndex = Math.max(headers.findIndex((cell) => cell.includes('rate')), 3);
                const remarksIndex = headers.findIndex((cell) => cell.includes('remark'));

                for (let i = 1; i < lines.length; i++) {
                    const columns = parseCSVLine(lines[i]);
                    if (columns.filter(Boolean).length < 2) continue;

                    const row = classifyRow(sheet.kind, columns, i);
                    const explicitRate = columns[rateIndex] ?? row.rate.toString();
                    const rate = parseFloat(String(explicitRate).replace(/,/g, '')) || row.rate;
                    const remarks = remarksIndex >= 0 ? columns[remarksIndex] || row.remarks : row.remarks;

                    parsed.push({
                        id: parseInt(columns[0]) || parsed.length + 1,
                        name: row.name,
                        unit: row.unit,
                        rate,
                        remarks,
                        sheetName: sheet.name,
                        kind: sheet.kind,
                        meta: row.meta,
                    });
                }
            });

            const unique = parsed.filter((item, index, self) =>
                index === self.findIndex((other) =>
                    other.name === item.name &&
                    other.unit === item.unit &&
                    other.rate === item.rate &&
                    other.sheetName === item.sheetName &&
                    other.meta === item.meta
                )
            );

            setRates(unique);
        } catch (error) {
            console.error('Failed to fetch rates:', error);
            setRates([]);
        } finally {
            setLoading(false);
        }
    };

    const sheets = useMemo(() => [...new Set(rates.map((rate) => rate.sheetName))], [rates]);

    const filteredRates = useMemo(() => {
        return rates
            .filter((rate) => {
                const matchesSheet = selectedSheet === 'all' || rate.sheetName === selectedSheet;
                const query = search.toLowerCase();
                const matchesSearch = !query || [rate.name, rate.unit, rate.remarks, rate.meta, rate.sheetName]
                    .filter(Boolean)
                    .some((value) => value!.toLowerCase().includes(query));
                return matchesSheet && matchesSearch;
            })
            .sort((a, b) => {
                const value = sortBy === 'name' ? a.name.localeCompare(b.name) : a.rate - b.rate;
                return sortOrder === 'asc' ? value : -value;
            });
    }, [rates, search, selectedSheet, sortBy, sortOrder]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="rates-modal rates-modal-modern" onClick={(e) => e.stopPropagation()}>
                <div className="rates-hero">
                    <div className="rates-hero-copy">
                        <span className="rates-eyebrow">Worksheet-based pricing library</span>
                        <h2>My Rates</h2>
                        <p>Browse worksheet pricing with quick filters and maximum room for the cards.</p>
                    </div>
                    <div className="rates-hero-actions">
                        <div className="rates-controls rates-controls-inline">
                            <div className="rates-search">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search material, unit, note, or sheet..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                                <option value="all">All Worksheets</option>
                                {sheets.map((sheet) => (
                                    <option key={sheet} value={sheet}>{sheet}</option>
                                ))}
                            </select>

                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [by, order] = e.target.value.split('-');
                                    setSortBy(by as 'name' | 'rate');
                                    setSortOrder(order as 'asc' | 'desc');
                                }}
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="rate-asc">Rate (Low to High)</option>
                                <option value="rate-desc">Rate (High to Low)</option>
                            </select>

                            <button className="rates-sort-btn" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                                <ArrowUpDown size={16} />
                                {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                            </button>
                        </div>
                    </div>
                    <button className="modal-close rates-close" onClick={onClose} aria-label="Close rates modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="rates-content rates-content-compact">
                    {loading ? (
                        <div className="rates-loading">
                            <div className="spinner"></div>
                            <p>Loading worksheets...</p>
                        </div>
                    ) : filteredRates.length === 0 ? (
                        <div className="rates-empty">
                            <Package size={48} />
                            <p>No matching rows found</p>
                        </div>
                    ) : (
                        <div className="rates-section-list">
                            {WORKSHEETS.map((sheet) => {
                                const sheetRates = filteredRates.filter((rate) => rate.sheetName === sheet.name);
                                if (!sheetRates.length) return null;

                                return (
                                    <section key={sheet.name} className="rates-section">
                                        <div className="rates-section-header">
                                            <div>
                                                <h3>{sheet.name}</h3>
                                                <p>{sheetRates.length} rows matched</p>
                                            </div>
                                            <span className="rates-section-pill">{sheet.kind}</span>
                                        </div>

                                        <div className="rates-grid">
                                            {sheetRates.map((rate) => (
                                                <article key={`${rate.sheetName}-${rate.id}-${rate.name}`} className="rate-card rate-card-modern">
                                                    <div className="rate-card-header">
                                                        <span className="rate-category">{toTitle(rate.kind)}</span>
                                                        <span className="rate-id">#{rate.id}</span>
                                                    </div>
                                                    <h3 className="rate-name">{rate.name}</h3>
                                                    <div className="rate-badges">
                                                        <span className="rate-sheet-badge">{rate.sheetName}</span>
                                                        {rate.meta && <span className="rate-meta-badge">{rate.meta}</span>}
                                                    </div>
                                                    <div className="rate-info">
                                                        <div className="rate-unit">
                                                            <span>Unit:</span> {rate.unit}
                                                        </div>
                                                        <div className="rate-price">
                                                            <IndianRupee size={16} />
                                                            <span>{formatIndianNumber(rate.rate)}</span>
                                                        </div>
                                                    </div>
                                                    {rate.remarks && <p className="rate-remarks">{rate.remarks}</p>}
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rates-footer">
                    <span>Showing {filteredRates.length} of {rates.length} rows</span>
                    <button className="btn btn-secondary" onClick={fetchRates} disabled={loading}>
                        ↻ Refresh Rates
                    </button>
                </div>
            </div>
        </div>
    );
}
