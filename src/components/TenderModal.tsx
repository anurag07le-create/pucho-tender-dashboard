import { X, ExternalLink, FileText, Download, CheckCircle, Info, Landmark, TrendingUp, List } from 'lucide-react';

export default function TenderModal({ tender, onClose }: { tender: any, onClose: () => void }) {
    const raw = tender.rawData || {};

    // Keys that are already shown in the top section
    const alreadyShownKeys = [
        'Tender title/Name Of Project', 
        'Organization Name', 
        'Department', 
        'Sub Department', 
        'Estimated Cost Value',
        'Tender Currency Setting',
        'Bid Submission Closing Date',
        'Location',
        'Address',
        'Remarks'
    ];

    const renderValue = (val: any) => {
        if (typeof val === 'object' && val !== null) {
            return <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{JSON.stringify(val, null, 2)}</pre>;
        }
        return String(val);
    };

    // Extract numeric-key entries (Bid Forms)
    const bidForms = Object.entries(raw).filter(([key]) => /^\d+$/.test(key));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div style={{ flex: 1 }}>
                        <span className="badge badge-success" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Open Tender</span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{raw['Tender title/Name Of Project'] || 'Tender Details'}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>ID: #{tender.id} • {tender.organisation}</p>
                    </div>
                    <button onClick={onClose} style={{ padding: '0.5rem', color: 'var(--text-muted)', borderRadius: '50%', background: 'transparent', transition: 'background 0.2s' }} className="close-btn">
                        <X size={24} />
                    </button>
                </header>

                <div className="modal-body">
                    <div className="grid-details">
                        <div className="detail-item">
                            <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Landmark size={12} /> Organisation Details</span>
                            <div className="detail-value">{tender.organisation}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tender.department} / {tender.subDepartment}</div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> Financials</span>
                            <div className="detail-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>{tender.estimatedCost}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currency: {raw['Tender Currency Setting']}</div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Important Dates</span>
                            <div className="detail-value">Submission: {tender.submissionDate}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Closing: {raw['Bid Submission Closing Date']}</div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Location</span>
                            <div className="detail-value">{raw['Location'] || 'N/A'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>{raw['Address']}</div>
                        </div>
                    </div>

                    {bidForms.length > 0 && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} /> Bid Forms & Fee Details
                            </h3>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                                gap: '1rem'
                            }}>
                                {bidForms.map(([id, name]) => (
                                    <div key={id} style={{ 
                                        background: '#fff', 
                                        border: '1px solid var(--border)', 
                                        padding: '1rem', 
                                        borderRadius: '8px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Form ID: {id}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{String(name)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <List size={18} /> Additional Information
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                            gap: '12px',
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)'
                        }}>
                            {Object.entries(raw).map(([key, value]) => {
                                if (alreadyShownKeys.includes(key)) return null;
                                if (/^\d+$/.test(key)) return null; // Skip bid forms
                                if (!value) return null;
                                return (
                                    <div key={key} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '4px' }}>{key}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>{renderValue(value)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={18} /> Documents
                            </h3>
                            {tender.downloadableDocuments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {tender.downloadableDocuments.map((doc: any, i: number) => (
                                        <a key={i} href={doc.link} target="_blank" className="doc-link">
                                            <Download size={14} /> {doc.name}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No documents available.</p>
                            )}
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} /> Requirements
                            </h3>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {tender.requiredDocuments.slice(0, 10).map((doc: any, i: number) => (
                                    <li key={i} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                        <div style={{ marginTop: '4px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                                        {doc.name}
                                    </li>
                                ))}
                                {tender.requiredDocuments.length > 10 && (
                                    <li style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)', opacity: 0.8 }}>+ {tender.requiredDocuments.length - 10} more requirements...</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={16} /> Remarks
                        </h3>
                        <div style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--text-main)', 
                            background: '#fff9eb', 
                            padding: '1.25rem', 
                            borderRadius: '8px', 
                            borderLeft: '4px solid #f59e0b',
                            lineHeight: '1.6'
                        }}>
                            {raw['Remarks'] || 'No additional remarks.'}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .close-btn:hover {
                    background: var(--bg-hover) !important;
                }
            `}</style>
        </div>
    );
}
