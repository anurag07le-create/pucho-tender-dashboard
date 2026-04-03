'use client';

import { useState, useEffect } from 'react';
import { X, Download, CheckCircle, ChevronDown, ChevronRight, Building2, Calendar, MapPin, IndianRupee, Award, FileCheck, ClipboardList, Check, XCircle, AlertTriangle, Shield, Search, Package, ExternalLink } from 'lucide-react';

const WEBHOOK_URL = 'https://studio.pucho.ai/api/v1/webhooks/g5XBKKE9gwfqEJBt5140t';

export default function TenderModal({ tender, onClose }: { tender: any, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedSections, setExpandedSections] = useState<number[]>([0]);
    const [showAllRequirements, setShowAllRequirements] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [ratesData, setRatesData] = useState<any[]>([]);
    const [ratesLoading, setRatesLoading] = useState(false);
    const [ratesError, setRatesError] = useState<string | null>(null);
    const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
    const [ratesSearch, setRatesSearch] = useState('');
    const [ratesSortBy, setRatesSortBy] = useState<'name' | 'rate'>('name');
    const [ratesSortOrder, setRatesSortOrder] = useState<'asc' | 'desc'>('asc');
    const [expandedRateId, setExpandedRateId] = useState<string | null>(null);
    const raw = tender.rawData || {};

    const getStatusClass = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'open') return 'open';
        if (s === 'accepted') return 'accepted';
        if (s === 'rejected') return 'rejected';
        return 'pending';
    };

    const renderEligibilityValue = (value: any, label?: string) => {
        if (!value) return null;
        const strValue = String(value);
        
        // Skip class highlighting for certain fields
        if (label?.toLowerCase().includes('notice') || label?.toLowerCase().includes('number')) {
            return strValue;
        }
        
        // Only highlight if "class" keyword is present near the letter
        const classPattern = /class\s*['"]?([A-Za-z][0-9]?(-[0-9]+)?)['"]?|['"]?([A-Za-z][0-9]?(-[0-9]+)?)['"]?\s*class/gi;
        const match = classPattern.exec(strValue);
        
        if (match) {
            const classLetter = match[1] || match[3];
            if (classLetter) {
                const parts = strValue.split(new RegExp(`(class\\s*['"]?${classLetter}['"]?|['"]?${classLetter}['"]?\\s*class)`, 'i'));
                return (
                    <>
                        {parts[0]}
                        <span className="class-badge">Class {classLetter.toUpperCase()}</span>
                        {parts.slice(2).join('')}
                    </>
                );
            }
        }
        return strValue;
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const toggleSection = (index: number) => {
        setExpandedSections(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleAction = async (action: 'accept' | 'reject') => {
        setActionLoading(action);
        try {
            const nextStatus = action === 'accept' ? 'Accepted' : 'Rejected';
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    status: nextStatus,
                    tenderId: tender.id,
                    tenderName: tender.name,
                    organisation: tender.organisation,
                    department: tender.department,
                    subDepartment: tender.subDepartment,
                    estimatedCost: tender.estimatedCost,
                    submissionDate: tender.submissionDate,
                }),
            });
            if (!response.ok) {
                throw new Error(`Webhook request failed with status ${response.status}`);
            }
            if (typeof window !== 'undefined') {
                const updated = { ...tender, status: nextStatus };
                const event = new CustomEvent('tender-status-updated', { detail: updated });
                window.dispatchEvent(event);
            }
            onClose();
        } catch (error) {
            console.error('Failed to send action:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const formatIndianNumber = (num: number): string => {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const parseRatesCSV = (csvText: string, currentWorksheet: string = 'Sheet1'): any[] => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const results: any[] = [];
        
        const parseLine = (line: string): string[] => {
            const fields: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i+1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    fields.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            fields.push(current.trim());
            return fields;
        };
        
        const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
        const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));
        
        if (currentWorksheet.toLowerCase() === 'summary') {
            const descIdx = getIdx(['description', 'item']);
            const sorAmountIdx = getIdx(['sor amount', 'amount_sor']);
            const pushpAmountIdx = getIdx(['pushp', 'tender', 'amount_tender']);
            const diffIdx = getIdx(['% difference', 'difference']);
            
            for (let i = 1; i < lines.length; i++) {
                const columns = parseLine(lines[i]);
                if (columns.filter(c => c.trim()).length < 2) continue;
                
                const itemName = descIdx >= 0 ? columns[descIdx] : columns[1] || columns[0];
                const sorAmount = sorAmountIdx >= 0 ? parseFloat(columns[sorAmountIdx].replace(/,/g, '')) || 0 : 0;
                const pushpAmount = pushpAmountIdx >= 0 ? parseFloat(columns[pushpAmountIdx].replace(/,/g, '')) || 0 : 0;
                const diff = diffIdx >= 0 ? columns[diffIdx] : '';
                
                if (itemName) {
                    results.push({
                        id: columns[0] || i.toString(),
                        name: itemName,
                        sorAmount,
                        pushpAmount,
                        difference: diff,
                        worksheetName: currentWorksheet,
                        isSummary: true
                    });
                }
            }
        } else {
            const descIdx = getIdx(['description', 'abstract']);
            const qtyIdx = getIdx(['quantity', 'qty']);
            const unitIdx = getIdx(['unit']);
            const rateSorIdx = getIdx(['rate_sor', 'sor rate']);
            const rateTenderIdx = getIdx(['rate_tender', 'pushp infra', 'tender rate']);
            const amountSorIdx = getIdx(['amount_sor', 'sor amount']);
            const amountTenderIdx = getIdx(['amount_tender', 'tender amount']);
            const evidenceIdx = getIdx(['evidence', 'remark']);
            
            for (let i = 1; i < lines.length; i++) {
                const columns = parseLine(lines[i]);
                if (columns.filter(c => c.trim()).length < 2) continue;
                
                const itemName = descIdx >= 0 ? columns[descIdx] : columns[1] || columns[0];
                const unit = unitIdx >= 0 ? columns[unitIdx] : '';
                const qtyStr = qtyIdx >= 0 ? columns[qtyIdx].replace(/,/g, '') : '';
                const qty = parseFloat(qtyStr);
                
                let rateSor = rateSorIdx >= 0 ? parseFloat(columns[rateSorIdx].replace(/,/g, '')) : 0;
                if (rateSorIdx < 0 || isNaN(rateSor)) {
                    // Fallback to finding the last number
                    for (let j = columns.length - 1; j >= 0; j--) {
                        if (evidenceIdx === j) continue;
                        const cleaned = columns[j].replace(/,/g, '').replace(/[^0-9.-]/g, '');
                        const num = parseFloat(cleaned);
                        if (!isNaN(num) && num > 0) { rateSor = num; break; }
                    }
                }
                
                const rateTender = rateTenderIdx >= 0 ? parseFloat(columns[rateTenderIdx].replace(/,/g, '')) || 0 : null;
                const amountSor = amountSorIdx >= 0 ? parseFloat(columns[amountSorIdx].replace(/,/g, '')) || 0 : 0;
                const amountTender = amountTenderIdx >= 0 ? parseFloat(columns[amountTenderIdx].replace(/,/g, '')) || 0 : 0;
                const evidence = evidenceIdx >= 0 ? columns[evidenceIdx] : '';
                
                if (itemName && itemName.length > 2) {
                    results.push({
                        id: columns[0] || i.toString(),
                        name: itemName,
                        unit,
                        quantity: isNaN(qty) ? '' : qty,
                        rate: isNaN(rateSor) ? 0 : rateSor,
                        rateTender: rateTender,
                        amountSor: amountSor,
                        amountTender: amountTender,
                        evidence: evidence,
                        worksheetName: currentWorksheet,
                        isSummary: false
                    });
                }
            }
        }
        
        return results;
    };

    const fetchTenderRates = async () => {
        if (!tender.rateSpreadsheetId) return;
        
        setRatesLoading(true);
        setRatesError(null);
        
        try {
            // Step 1: Fetch HTML View to get Worksheet IDs and Names
            const htmlUrl = `https://docs.google.com/spreadsheets/d/${tender.rateSpreadsheetId}/htmlview`;
            const htmlRes = await fetch(htmlUrl, { cache: 'no-store' });
            
            if (!htmlRes.ok) {
                throw new Error('Failed to fetch spreadsheet HTML');
            }
            
            const htmlText = await htmlRes.text();
            
            // Extract worksheets using regex
            const worksheets: { name: string, gid: string }[] = [];
            // Match pattern like items.push({name: "Concrete Work", ... gid: "1404401302", ...})
            // Using a resilient pattern as script syntax may evolve slightly
            const regex = /items\.push\(\{name:\s*"([^"]+)",[^{]*gid:\s*"(\d+)"/g;
            let match;
            while ((match = regex.exec(htmlText)) !== null) {
                worksheets.push({ name: match[1], gid: match[2] });
            }
            
            // If no worksheets found via regex, fallback to default single-fetch
            if (worksheets.length === 0) {
                const csvUrl = `https://docs.google.com/spreadsheets/d/${tender.rateSpreadsheetId}/export?format=csv`;
                const response = await fetch(csvUrl, { cache: 'no-store' });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch fallback rates');
                }
                
                const csvText = await response.text();
                const parsedData = parseRatesCSV(csvText, 'Sheet1');
                
                setRatesData(parsedData);
            } else {
                // Fetch all worksheets in parallel
                const fetchPromises = worksheets.map(async (ws) => {
                    const wsCsvUrl = `https://docs.google.com/spreadsheets/d/${tender.rateSpreadsheetId}/export?format=csv&gid=${ws.gid}`;
                    try {
                        const wsRes = await fetch(wsCsvUrl, { cache: 'no-store' });
                        if (!wsRes.ok) return [];
                        const wsCsvText = await wsRes.text();
                        return parseRatesCSV(wsCsvText, ws.name);
                    } catch (e) {
                        console.warn(`Failed to fetch sheet ${ws.name}`, e);
                        return [];
                    }
                });
                
                const allResults = await Promise.all(fetchPromises);
                const combinedData = allResults.flat();
                setRatesData(combinedData);
            }

            setSelectedWorksheet('');
        } catch (error) {
            console.error('Rates fetch error:', error);
            setRatesError('Unable to load rates. The spreadsheet may not be publicly accessible.');
        } finally {
            setRatesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'rates' && tender.rateSpreadsheetId && ratesData.length === 0 && !ratesLoading) {
            fetchTenderRates();
        }
    }, [activeTab, tender.rateSpreadsheetId]);

    const baseTabs = [
        { id: 'overview', label: 'Overview', icon: ClipboardList },
        { id: 'eligibility', label: 'Eligibility', icon: Award },
        { id: 'documents', label: 'Documents', icon: Download },
        { id: 'details', label: 'Details', icon: Building2 }
    ];
    
    if (tender.rateSpreadsheetId) {
        baseTabs.push({ id: 'rates', label: 'Rates', icon: IndianRupee });
    }
    
    const tabs = baseTabs;

    const renderOverview = () => (
        <div>
            <div className="info-grid">
                <div className="info-card">
                    <div className="info-card-label">
                        <Building2 size={14} /> Organisation
                    </div>
                    <div className="info-card-value">{tender.organisation || 'N/A'}</div>
                    <div className="info-card-sub">{tender.department} / {tender.subDepartment}</div>
                </div>
                <div className="info-card highlight">
                    <div className="info-card-label">
                        <IndianRupee size={14} /> Estimated Cost
                    </div>
                    <div className="info-card-value highlight">{tender.estimatedCost || 'N/A'}</div>
                </div>
                <div className="info-card">
                    <div className="info-card-label">
                        <Calendar size={14} /> Submission Date
                    </div>
                    <div className="info-card-value">{tender.submissionDate || 'N/A'}</div>
                    <div className="info-card-sub">Closing: {raw['Bid Submission Closing Date'] || 'N/A'}</div>
                </div>
                <div className="info-card">
                    <div className="info-card-label">
                        <MapPin size={14} /> Location
                    </div>
                    <div className="info-card-value">{raw['Location'] || 'N/A'}</div>
                </div>
            </div>

            <div className={`status-banner ${getStatusClass(tender.status)}`}>
                <div className="status-banner-header">
                    <CheckCircle size={18} />
                    Status: {tender.status || 'Open'}
                </div>
                {raw['Remarks'] && (
                    <p className="status-banner-text">{raw['Remarks'].toString()}</p>
                )}
            </div>

            <div className="requirements-section">
                <div className="requirements-title">Key Requirements ({tender.requiredDocuments?.length || 0})</div>
                <div className="requirements-tags">
                    {tender.requiredDocuments?.slice(0, showAllRequirements ? undefined : 5).map((doc: any, i: number) => (
                        <span key={i} className="req-tag">
                            {doc.name.length > 40 ? doc.name.substring(0, 40) + '...' : doc.name}
                        </span>
                    ))}
                    {tender.requiredDocuments?.length > 5 && (
                        <button 
                            className="req-tag more"
                            onClick={() => setShowAllRequirements(!showAllRequirements)}
                        >
                            {showAllRequirements ? 'Show less' : `+${tender.requiredDocuments.length - 5} more`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderEligibility = () => (
        <div>
            {tender.eligibilityCriteria?.length > 0 ? (
                tender.eligibilityCriteria.map((section: any, sIndex: number) => {
                    if (section.type === 'disqualification' && section.items) {
                        return (
                            <div key={sIndex} className="disqualification-section">
                                <div className="disqualification-header">
                                    <AlertTriangle size={18} />
                                    {section.title}
                                </div>
                                <ul className="disqualification-list">
                                    {section.items.map((item: any, iIndex: number) => (
                                        <li key={iIndex}>{item.value}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }
                    if (section.type === 'section' && section.items) {
                        const isExpanded = expandedSections.includes(sIndex);
                        const isStatutory = section.title === 'Statutory Compliance';
                        return (
                            <div key={sIndex} className="eligibility-accordion">
                                <button
                                    onClick={() => toggleSection(sIndex)}
                                    className={`accordion-btn ${isStatutory ? 'statutory' : ''}`}
                                >
                                    <span className="accordion-title">
                                        {isStatutory ? <Shield size={18} /> : <FileCheck size={18} />} {section.title}
                                    </span>
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                                {isExpanded && (
                                    <div className="accordion-content">
                                        {isStatutory ? (
                                            <div className="statutory-grid">
                                                {section.items.map((item: any, iIndex: number) => {
                                                    const val = String(item.value || '');
                                                    return (
                                                        <div key={iIndex} className="statutory-item">
                                                            <span className="statutory-label">{item.label}</span>
                                                            <span className={`statutory-badge ${val.toLowerCase()}`}>{val}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="eligibility-grid">
                                                {section.items.map((item: any, iIndex: number) => (
                                                    <div key={iIndex} className="eligibility-item">
                                                        <div className="eligibility-label">{item.label}</div>
                                                        <div className="eligibility-value">{renderEligibilityValue(item.value, item.label)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                })
            ) : (
                <div className="empty-text">No eligibility criteria available</div>
            )}
        </div>
    );

    const renderDocuments = () => (
        <div className="documents-grid">
            <div>
                <div className="documents-column-title">Downloadable Documents</div>
                {tender.downloadableDocuments?.length > 0 ? (
                    <div className="document-list">
                        {tender.downloadableDocuments.map((doc: any, i: number) => (
                            <a key={i} href={doc.link} target="_blank" rel="noopener noreferrer" className="document-link">
                                <Download size={16} /> {doc.name}
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="empty-text">No documents available</div>
                )}
            </div>
            <div>
                <div className="documents-column-title">Required Documents ({tender.requiredDocuments?.length || 0})</div>
                <div className="required-docs-list">
                    {tender.requiredDocuments?.map((doc: any, i: number) => (
                        <div key={i} className="required-doc-item">
                            <span className="doc-bullet" />
                            {doc.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderDetails = () => {
        const alreadyShownKeys = ['Tender title/Name Of Project', 'Organization Name', 'Department', 'Sub Department', 'Estimated Cost Value', 'Tender Currency Setting', 'Bid Submission Closing Date', 'Location', 'Address', 'Remarks'];
        const bidForms = Object.entries(raw).filter(([key]) => /^\d+$/.test(key));
        const otherFields = Object.entries(raw).filter(([key, value]) => !alreadyShownKeys.includes(key) && !/^\d+$/.test(key) && value);

        return (
            <div>
                {bidForms.length > 0 && (
                    <div className="details-block">
                        <div className="details-title">Bid Forms ({bidForms.length})</div>
                        <div className="bid-forms-grid">
                            {bidForms.map(([id, name]) => (
                                <div key={id} className="bid-form-item">
                                    <span className="form-id-text">#{id}</span>
                                    <div className="form-name-text">{String(name)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {otherFields.length > 0 && (
                    <div className="details-block">
                        <div className="details-title">Additional Information</div>
                        <div className="additional-info-grid">
                            {otherFields.map(([key, value]) => (
                                <div key={key} className="additional-item">
                                    <div className="additional-key">{key}</div>
                                    <div className="additional-value">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderRates = () => {
        const worksheets = [...new Set(ratesData.map(r => r.worksheetName))];
        
        const summaryData = ratesData.filter(r => r.isSummary);
        const categoryData = ratesData.filter(r => !r.isSummary);
        
        const filteredData = categoryData
            .filter(r => !selectedWorksheet || r.worksheetName === selectedWorksheet)
            .filter(r => !ratesSearch || 
                r.name.toLowerCase().includes(ratesSearch.toLowerCase()) ||
                r.unit.toLowerCase().includes(ratesSearch.toLowerCase()) ||
                (r.evidence && r.evidence.toLowerCase().includes(ratesSearch.toLowerCase())))
            .sort((a, b) => {
                const value = ratesSortBy === 'name' 
                    ? a.name.localeCompare(b.name) 
                    : a.rate - b.rate;
                return ratesSortOrder === 'asc' ? value : -value;
            });
        
        const totalValue = filteredData.reduce((sum, r) => sum + r.rate, 0);
        const avgRate = filteredData.length > 0 ? Math.round(totalValue / filteredData.length) : 0;
        
        if (ratesLoading) {
            return (
                <div className="rates-loading-skeleton">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-line short"></div>
                            <div className="skeleton-line medium"></div>
                            <div className="skeleton-line long"></div>
                        </div>
                    ))}
                </div>
            );
        }
        
        if (ratesError) {
            return (
                <div className="rates-error">
                    <AlertTriangle size={48} />
                    <p>{ratesError}</p>
                    <button className="btn btn-secondary" onClick={fetchTenderRates}>
                        ↻ Retry
                    </button>
                </div>
            );
        }
        
        return (
            <div className="rates-tab-content">
                <div className="rates-summary-inline">
                    <div className="rate-stat-mini">
                        <span className="rate-stat-value">{worksheets.length}</span>
                        <span className="rate-stat-label">Sheets</span>
                    </div>
                    <div className="rate-stat-mini">
                        <span className="rate-stat-value">{ratesData.length}</span>
                        <span className="rate-stat-label">Items</span>
                    </div>
                    <div className="rate-stat-mini">
                        <span className="rate-stat-value">₹{formatIndianNumber(avgRate)}</span>
                        <span className="rate-stat-label">Avg Rate</span>
                    </div>
                </div>
                
                <div className="rates-controls">
                    <div className="rates-search-mini">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={ratesSearch}
                            onChange={(e) => setRatesSearch(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        value={selectedWorksheet} 
                        onChange={(e) => setSelectedWorksheet(e.target.value)}
                        className="worksheet-select"
                    >
                        <option value="">All Category Sheets</option>
                        {worksheets.map(ws => (
                            <option key={ws} value={ws}>{ws}</option>
                        ))}
                    </select>
                    
                    <select 
                        value={`${ratesSortBy}-${ratesSortOrder}`}
                        onChange={(e) => {
                            const [by, order] = e.target.value.split('-');
                            setRatesSortBy(by as 'name' | 'rate');
                            setRatesSortOrder(order as 'asc' | 'desc');
                        }}
                        className="rates-sort-select"
                    >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="rate-asc">Rate (Low-High)</option>
                        <option value="rate-desc">Rate (High-Low)</option>
                    </select>
                    
                    <a 
                        href={`https://docs.google.com/spreadsheets/d/${tender.rateSpreadsheetId}/view`}
                        target="_blank" rel="noopener noreferrer"
                        className="google-sheets-link"
                    >
                        <ExternalLink size={14} /> Open in Google Sheets
                    </a>
                </div>
                
                {selectedWorksheet === 'Summary' && summaryData.length > 0 ? (
                    <div className="rates-summary-table-container">
                        <table className="rates-summary-table">
                            <thead>
                                <tr>
                                    <th>Sr No.</th>
                                    <th>Description</th>
                                    <th>SOR Amount</th>
                                    <th>Pushp InfraTech Amount_Tender</th>
                                    <th>% Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map((item, idx) => (
                                    <tr key={`summary-${idx}`}>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td><IndianRupee size={12} /> {formatIndianNumber(item.sorAmount)}</td>
                                        <td><IndianRupee size={12} /> {formatIndianNumber(item.pushpAmount)}</td>
                                        <td>{item.difference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <>
                        <div className="rates-count">
                            Showing {filteredData.length} category items {selectedWorksheet && `for ${selectedWorksheet}`}
                        </div>
                        
                        {filteredData.length === 0 ? (
                            <div className="rates-empty">
                                <Package size={48} />
                                <p>No matching items found</p>
                            </div>
                        ) : (
                            <div className="rates-grid-mini">
                                {filteredData.map((item, idx) => {
                                    const cardId = `${item.worksheetName}-${item.id}-${idx}`;
                                    const isExpanded = expandedRateId === cardId;
                                    
                                    return (
                                        <div 
                                            key={cardId} 
                                            className={`rate-card-compact ${isExpanded ? 'expanded' : ''}`}
                                            onClick={() => setExpandedRateId(isExpanded ? null : cardId)}
                                        >
                                            <div className="rate-card-header-mini">
                                                <span className="rate-id-mini">#{item.id}</span>
                                                {item.worksheetName && item.worksheetName !== 'Sheet1' && (
                                                    <span className="rate-worksheet-badge">{item.worksheetName}</span>
                                                )}
                                            </div>
                                            <h4 className="rate-item-name" style={{ WebkitLineClamp: isExpanded ? 'unset' : 3 }}>{item.name}</h4>
                                            <div className="rate-card-footer">
                                                <div className="rate-qty-unit-wrapper">
                                                    {item.quantity && <span className="rate-qty-badge">{item.quantity}</span>}
                                                    {item.unit && <span className="rate-unit-mini">{item.unit}</span>}
                                                </div>
                                                <div className="rate-values-vertical">
                                                    <div className="rate-value-mini" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span className="rate-value-label">SOR RATE:</span>
                                                            <IndianRupee size={12} />
                                                            {formatIndianNumber(item.rate)}
                                                        </div>
                                                        {item.amountSor > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748b' }}>
                                                                <span className="rate-value-label" style={{ color: '#94a3b8' }}>AMT:</span>
                                                                <IndianRupee size={10} />
                                                                {formatIndianNumber(item.amountSor)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {item.rateTender !== null && item.rateTender !== 0 && !isNaN(item.rateTender) && (
                                                        <div className="rate-value-mini highlight-tender" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span className="rate-value-label">Pushp Infra Rate:</span>
                                                                <IndianRupee size={12} />
                                                                {formatIndianNumber(item.rateTender)}
                                                            </div>
                                                            {item.amountTender > 0 && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#16a34a', opacity: 0.8 }}>
                                                                    <span className="rate-value-label" style={{ color: '#16a34a' }}>AMT:</span>
                                                                    <IndianRupee size={10} />
                                                                    {formatIndianNumber(item.amountTender)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isExpanded && item.evidence && (
                                                <div className="rate-evidence-box fade-in">
                                                    <div className="evidence-header">Evidence / Remarks</div>
                                                    <p>{item.evidence}</p>
                                                </div>
                                            )}
                                            {!isExpanded && item.evidence && (
                                                <div className="rate-expand-hint mt-2 text-xs text-blue-500 font-medium">✨ Click to view Evidence</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-header-main">
                        {/* Status & ID */}
                        <div className="modal-header-left">
                            <span className={`modal-status ${getStatusClass(tender.status)}`}>
                                {tender.status || 'Open'}
                            </span>
                            <span className="modal-id">#{tender.id}</span>
                        </div>
                        
                        {/* Title & Org */}
                        <div className="modal-header-center">
                            <h2 className="modal-title">
                                {raw['Tender title/Name Of Project'] || tender.name || 'Tender Details'}
                            </h2>
                            <p className="modal-org">{tender.organisation}</p>
                        </div>
                        
                        {/* Close */}
                        <button onClick={onClose} className="modal-close">
                            <X size={18} />
                        </button>
                    </div>
                    
                    {/* Tabs & Actions */}
                    <div className="modal-tabs-row">
                        <div className="modal-tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {tender.status?.toLowerCase() === 'pending' && (
                            <div className="modal-actions">
                                <button 
                                    className="action-btn-text accept" 
                                    onClick={() => handleAction('accept')}
                                    disabled={actionLoading !== null}
                                >
                                    <Check size={14} />
                                    {actionLoading === 'accept' ? 'Processing...' : 'Approve'}
                                </button>
                                <button 
                                    className="action-btn-text reject" 
                                    onClick={() => handleAction('reject')}
                                    disabled={actionLoading !== null}
                                >
                                    <XCircle size={14} />
                                    {actionLoading === 'reject' ? 'Processing...' : 'Reject'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="modal-content-area">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'eligibility' && renderEligibility()}
                    {activeTab === 'documents' && renderDocuments()}
                    {activeTab === 'details' && renderDetails()}
                    {activeTab === 'rates' && renderRates()}
                </div>
            </div>
        </div>
    );
}
