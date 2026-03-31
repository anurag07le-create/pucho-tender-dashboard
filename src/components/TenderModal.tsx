'use client';

import { useState, useEffect } from 'react';
import { X, Download, CheckCircle, ChevronDown, ChevronRight, Building2, Calendar, MapPin, IndianRupee, Award, FileCheck, ClipboardList } from 'lucide-react';

export default function TenderModal({ tender, onClose }: { tender: any, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedSections, setExpandedSections] = useState<number[]>([0]);
    const raw = tender.rawData || {};

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

    const tabs = [
        { id: 'overview', label: 'Overview', icon: ClipboardList },
        { id: 'eligibility', label: 'Eligibility', icon: Award },
        { id: 'documents', label: 'Documents', icon: Download },
        { id: 'details', label: 'Details', icon: Building2 }
    ];

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

            <div className={`status-banner ${tender.status?.toLowerCase() === 'open' ? 'open' : 'pending'}`}>
                <div className="status-banner-header">
                    <CheckCircle size={18} />
                    Status: {tender.status || 'Open'}
                </div>
                {raw['Remarks'] && (
                    <div className="status-banner-text">{raw['Remarks']}</div>
                )}
            </div>

            <div className="requirements-section">
                <div className="requirements-title">Key Requirements ({tender.requiredDocuments?.length || 0})</div>
                <div className="requirements-tags">
                    {tender.requiredDocuments?.slice(0, 5).map((doc: any, i: number) => (
                        <span key={i} className="req-tag">
                            {doc.name.length > 40 ? doc.name.substring(0, 40) + '...' : doc.name}
                        </span>
                    ))}
                    {tender.requiredDocuments?.length > 5 && (
                        <span className="req-tag more">
                            +{tender.requiredDocuments.length - 5} more
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    const renderEligibility = () => (
        <div>
            {tender.eligibilityCriteria?.length > 0 ? (
                tender.eligibilityCriteria.map((section: any, sIndex: number) => {
                    if (section.type === 'section' && section.items) {
                        const isExpanded = expandedSections.includes(sIndex);
                        return (
                            <div key={sIndex} className="eligibility-accordion">
                                <button
                                    onClick={() => toggleSection(sIndex)}
                                    className="accordion-btn"
                                >
                                    <span className="accordion-title">
                                        <FileCheck size={18} /> {section.title}
                                    </span>
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                                {isExpanded && (
                                    <div className="accordion-content">
                                        <div className="eligibility-grid">
                                            {section.items.map((item: any, iIndex: number) => (
                                                <div key={iIndex} className="eligibility-item">
                                                    <div className="eligibility-label">{item.label}</div>
                                                    <div className="eligibility-value">{item.value}</div>
                                                </div>
                                            ))}
                                        </div>
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

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Compact Header */}
                <div className="modal-header" style={{ padding: '0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        {/* Left: Status & ID */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '80px' }}>
                            <span className={`modal-status ${tender.status?.toLowerCase() === 'open' ? 'open' : 'pending'}`}>
                                {tender.status || 'Open'}
                            </span>
                            <span className="modal-id">#{tender.id}</span>
                        </div>
                        
                        {/* Center: Title & Org */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 className="modal-title" style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>
                                {raw['Tender title/Name Of Project'] || tender.name || 'Tender Details'}
                            </h2>
                            <p className="modal-org" style={{ fontSize: '0.8rem' }}>{tender.organisation}</p>
                        </div>
                        
                        {/* Right: Close */}
                        <button onClick={onClose} className="modal-close" style={{ padding: '0.4rem' }}>
                            <X size={18} />
                        </button>
                    </div>
                    
                    {/* Tabs Row */}
                    <div className="modal-tabs" style={{ marginTop: '0.75rem', marginLeft: '0' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="modal-content-area">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'eligibility' && renderEligibility()}
                    {activeTab === 'documents' && renderDocuments()}
                    {activeTab === 'details' && renderDetails()}
                </div>
            </div>
        </div>
    );
}
