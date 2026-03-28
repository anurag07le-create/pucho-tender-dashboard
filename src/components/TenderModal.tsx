import { X, ExternalLink, FileText, Download, CheckCircle, Info, Landmark, TrendingUp } from 'lucide-react';

export default function TenderModal({ tender, onClose }: { tender: any, onClose: () => void }) {
    const raw = tender.rawData || {};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div>
                        <span className="badge badge-success" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Open Tender</span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{raw['Tender title/Name Of Project'] || 'Tender Details'}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>ID: #{tender.id} • {tender.organisation}</p>
                    </div>
                    <button onClick={onClose} style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{raw['Address']}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} /> Downloadable Documents
                        </h3>
                        {tender.downloadableDocuments.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {tender.downloadableDocuments.map((doc: any, i: number) => (
                                    <a key={i} href={doc.link} target="_blank" className="doc-link">
                                        <Download size={14} /> {doc.name}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No documents available for download.</p>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={18} /> Required Documents
                        </h3>
                        <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {tender.requiredDocuments.map((doc: any, i: number) => (
                                <li key={i} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                    <div style={{ marginTop: '4px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                                    {doc.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ marginTop: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={16} /> Additional Remarks
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                            {raw['Remarks'] || 'No additional remarks.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
