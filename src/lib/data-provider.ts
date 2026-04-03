const CSV_URL = 'https://docs.google.com/spreadsheets/d/17ozRDo5_2RCR0P2DPEb_bVKsdlS9MB6_s1N1atZ-q1Y/export?format=csv&gid=0';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isValidValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (value === 'Field Not Found' || value === 'Field Not Found.') return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
}

function mergeAllJsonSources(data: any): any {
    const jsonKeys = Object.keys(data)
        .filter(k => k.startsWith('json_data_'))
        .sort();
    
    if (jsonKeys.length === 0) return data;
    
    const merged: any = {};
    
    for (const key of jsonKeys) {
        const source = data[key];
        if (!source || typeof source !== 'object') continue;
        
        for (const sectionKey of Object.keys(source)) {
            const section = source[sectionKey];
            
            if (!section || typeof section !== 'object') continue;
            
            if (!merged[sectionKey]) {
                merged[sectionKey] = {};
            }
            
            for (const fieldKey of Object.keys(section)) {
                const value = section[fieldKey];
                
                // Skip invalid values
                if (!isValidValue(value)) continue;
                
                // Handle nested objects (like work_completion_requirement)
                if (typeof value === 'object' && !Array.isArray(value)) {
                    if (!merged[sectionKey][fieldKey]) {
                        merged[sectionKey][fieldKey] = {};
                    }
                    for (const subKey of Object.keys(value)) {
                        const subValue = value[subKey];
                        if (isValidValue(subValue)) {
                            // Merge all valid nested values
                            merged[sectionKey][fieldKey][subKey] = subValue;
                        }
                    }
                } else if (Array.isArray(value)) {
                    // Concatenate arrays from all sources
                    if (!merged[sectionKey][fieldKey]) {
                        merged[sectionKey][fieldKey] = [];
                    }
                    merged[sectionKey][fieldKey] = [...merged[sectionKey][fieldKey], ...value];
                } else {
                    // For simple values, collect all unique valid values
                    if (!merged[sectionKey][fieldKey]) {
                        merged[sectionKey][fieldKey] = value;
                    } else if (merged[sectionKey][fieldKey] !== value) {
                        // If different valid values exist, keep both (as array)
                        if (!Array.isArray(merged[sectionKey][fieldKey])) {
                            merged[sectionKey][fieldKey] = [merged[sectionKey][fieldKey]];
                        }
                        if (!merged[sectionKey][fieldKey].includes(value)) {
                            merged[sectionKey][fieldKey].push(value);
                        }
                    }
                }
            }
        }
    }
    
    return Object.keys(merged).length > 0 ? merged : data;
}

function formatEligibilityCriteria(data: any): any[] {
    const sections: any[] = [];
    
    // Merge all json_data sources
    const source = mergeAllJsonSources(data);
    
    const formatValue = (val: any): any => {
        if (Array.isArray(val)) {
            return val.join(' | ');
        }
        return val;
    };
    
    const checkValue = (val: any): boolean => {
        if (!isValidValue(val)) return false;
        if (Array.isArray(val)) return val.length > 0;
        return true;
    };
    
    // Add Tender Information Section
    if (source.tender_info) {
        const info = source.tender_info;
        sections.push({
            type: 'section',
            title: 'Tender Information',
            items: [
                { label: 'Title', value: formatValue(info.title) },
                { label: 'Notice Number', value: formatValue(info.notice_number) },
                { label: 'Estimated Value', value: formatValue(info.estimated_value) },
                { label: 'Completion Period', value: formatValue(info.completion_period) },
                { label: 'Bid Validity', value: formatValue(info.bid_validity) },
                { label: 'Last Date of Submission', value: formatValue(info.last_date_of_submission) },
                { label: 'Technical Bid Opening', value: formatValue(info.technical_bid_opening_date) }
            ].filter(item => checkValue(item.value))
        });
    }
    
    // Add Technical Eligibility Section
    if (source.technical_eligibility) {
        const tech = source.technical_eligibility;
        const techItems = [];
        
        if (checkValue(tech.min_experience_years)) {
            techItems.push({ label: 'Minimum Experience', value: formatValue(tech.min_experience_years) });
        }
        
        if (checkValue(tech.registration_class_required)) {
            techItems.push({ label: 'Registration Class Required', value: formatValue(tech.registration_class_required) });
        }
        
        if (tech.work_completion_requirement) {
            const work = tech.work_completion_requirement;
            if (checkValue(work.single_work_80_percent)) {
                techItems.push({ label: 'Single Work (80% Value)', value: formatValue(work.single_work_80_percent) });
            }
            if (checkValue(work.two_works_50_percent)) {
                techItems.push({ label: 'Two Works (50% Value)', value: formatValue(work.two_works_50_percent) });
            }
            if (checkValue(work.three_works_40_percent)) {
                techItems.push({ label: 'Three Works (40% Value)', value: formatValue(work.three_works_40_percent) });
            }
            if (checkValue(work.type_of_similar_work_previously_done)) {
                techItems.push({ label: 'Similar Work Type', value: formatValue(work.type_of_similar_work_previously_done) });
            }
            if (checkValue(work.value_or_rate_of_similar_work)) {
                techItems.push({ label: 'Similar Work Value', value: formatValue(work.value_or_rate_of_similar_work) });
            }
        }
        
        if (checkValue(tech.type_of_building)) {
            techItems.push({ label: 'Type of Building', value: formatValue(tech.type_of_building) });
        }
        
        if (checkValue(tech.specific_equipment_manpower)) {
            techItems.push({ label: 'Equipment & Manpower', value: formatValue(tech.specific_equipment_manpower) });
        }
        
        if (techItems.length > 0) {
            sections.push({
                type: 'section',
                title: 'Technical Eligibility',
                items: techItems
            });
        }
    }
    
    // Add Financial Eligibility Section
    if (source.financial_eligibility) {
        const fin = source.financial_eligibility;
        const finItems = [];
        
        if (checkValue(fin.avg_annual_turnover)) {
            finItems.push({ label: 'Average Annual Turnover', value: formatValue(fin.avg_annual_turnover) });
        }
        
        if (checkValue(fin.solvency_certificate_value)) {
            finItems.push({ label: 'Solvency Certificate Value', value: formatValue(fin.solvency_certificate_value) });
        }
        
        if (checkValue(fin.net_worth_requirement)) {
            finItems.push({ label: 'Net Worth Requirement', value: formatValue(fin.net_worth_requirement) });
        }
        
        if (checkValue(fin.bank_type_stipulation)) {
            finItems.push({ label: 'Bank Type Stipulation', value: formatValue(fin.bank_type_stipulation) });
        }
        
        if (finItems.length > 0) {
            sections.push({
                type: 'section',
                title: 'Financial Eligibility',
                items: finItems
            });
        }
    }
    
    // Add Costs & Deposits Section
    if (source.costs_and_deposits) {
        const costs = source.costs_and_deposits;
        const costItems = [];
        
        if (checkValue(costs.tender_document_fee)) {
            costItems.push({ label: 'Tender Document Fee', value: formatValue(costs.tender_document_fee) });
        }
        
        if (checkValue(costs.emd_amount)) {
            costItems.push({ label: 'EMD Amount', value: formatValue(costs.emd_amount) });
        }
        
        if (costs.emd_exemption_allowed !== undefined) {
            costItems.push({ label: 'EMD Exemption', value: costs.emd_exemption_allowed ? 'Allowed' : 'Not Allowed' });
        }
        
        if (checkValue(costs.security_deposit_percentage)) {
            costItems.push({ label: 'Security Deposit', value: formatValue(costs.security_deposit_percentage) });
        }
        
        if (costItems.length > 0) {
            sections.push({
                type: 'section',
                title: 'Costs & Deposits',
                items: costItems
            });
        }
    }
    
    // Add Statutory Compliance Section
    if (source.statutory_compliance) {
        const stat = source.statutory_compliance;
        const statItems = [];
        
        if (stat.pan_card && stat.pan_card !== 'not mentioned') {
            statItems.push({ label: 'PAN Card', value: stat.pan_card === 'required' ? 'Required' : stat.pan_card });
        }
        if (stat.gst_reg && stat.gst_reg !== 'not mentioned') {
            statItems.push({ label: 'GST Registration', value: stat.gst_reg === 'required' ? 'Required' : stat.gst_reg });
        }
        if (stat.epf_esic && stat.epf_esic !== 'not mentioned') {
            statItems.push({ label: 'EPF/ESIC', value: stat.epf_esic === 'required' ? 'Required' : stat.epf_esic });
        }
        if (stat.labor_license && stat.labor_license !== 'not mentioned') {
            statItems.push({ label: 'Labor License', value: stat.labor_license === 'required' ? 'Required' : stat.labor_license });
        }
        
        if (statItems.length > 0) {
            sections.push({
                type: 'section',
                title: 'Statutory Compliance',
                items: statItems
            });
        }
    }
    
    // Add Disqualification Triggers Section (arrays are concatenated, dedupe them)
    if (source.disqualification_triggers && Array.isArray(source.disqualification_triggers) && source.disqualification_triggers.length > 0) {
        const uniqueTriggers = [...new Set(source.disqualification_triggers as string[])];
        sections.push({
            type: 'disqualification',
            title: 'Disqualification Triggers',
            items: uniqueTriggers.map((trigger) => ({ label: '', value: trigger }))
        });
    }
    
    return sections.length > 0 ? sections : [];
}

function extractCriteria(obj: any, depth = 0, maxItems = 50): string[] {
    const criteria: string[] = [];
    const maxDepth = 4;
    
    if (depth > maxDepth || criteria.length >= maxItems) return criteria;
    
    // Handle arrays
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (criteria.length >= maxItems) break;
            if (typeof item === 'string') {
                const cleaned = item.trim();
                if (cleaned.length > 5 && cleaned.length < 1000) {
                    criteria.push(cleaned);
                }
            } else if (typeof item === 'object' && item !== null) {
                criteria.push(...extractCriteria(item, depth + 1, maxItems - criteria.length));
            }
        }
        return criteria;
    }
    
    // Handle objects
    if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (criteria.length >= maxItems) break;
            
            // Skip metadata and numeric keys
            if (/^\d+$/.test(key) || key.startsWith('_') || key === 'id') continue;
            
            if (typeof value === 'string' && value.length > 0) {
                const cleaned = String(value).trim();
                // Only add substantial strings
                if (cleaned.length > 5 && cleaned.length < 1000 && !cleaned.match(/^[0-9\s\-\.]+$/)) {
                    criteria.push(cleaned);
                }
            } else if (Array.isArray(value)) {
                // Handle array values
                for (const item of value) {
                    if (criteria.length >= maxItems) break;
                    if (typeof item === 'string') {
                        const cleaned = item.trim();
                        if (cleaned.length > 5 && cleaned.length < 1000) {
                            criteria.push(cleaned);
                        }
                    } else if (typeof item === 'object') {
                        criteria.push(...extractCriteria(item, depth + 1, maxItems - criteria.length));
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                // Recurse into nested objects
                criteria.push(...extractCriteria(value, depth + 1, maxItems - criteria.length));
            }
        }
    }
    
    return criteria;
}

export async function getTenders() {
    try {
        const response = await fetch(CSV_URL, { 
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch data from sheet');
        
        const csvData = await response.text();
        const lines = csvData.split('\n');
        
        if (lines.length < 2) return [];

        const headers: string[] = [];
        let firstLine = lines[0];
        let hCurrent = '';
        let hInQuotes = false;
        for (let j = 0; j < firstLine.length; j++) {
            const char = firstLine[j];
            if (char === '"') hInQuotes = !hInQuotes;
            else if (char === ',' && !hInQuotes) { headers.push(hCurrent.trim()); hCurrent = ''; }
            else hCurrent += char;
        }
        headers.push(hCurrent.trim());
        
        const results = [];
        console.log(`CSV has ${lines.length - 1} data rows (excluding header)`);
        console.log(`Headers (${headers.length}):`, headers);
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const row: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    if (inQuotes && lines[i][j+1] === '"') {
                        current += '"';
                        j++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current.trim());

            // Log first few rows for debugging
            if (i <= 3) {
                console.log(`Row ${i}: ${row.length} columns, ID=${row[0]}`);
            }

            if (row.length < headers.length) {
                console.warn(`Row ${i} skipped: has ${row.length} columns, expected ${headers.length}`);
                continue;
            }

            const tender: any = {
                id: row[0],
                name: row[1],
                organisation: row[2],
                estimatedCost: row[3],
                department: row[4],
                subDepartment: row[5],
                submissionDate: row[6],
                downloadableDocuments: [],
                requiredDocuments: [],
                eligibilityCriteria: [],
                status: 'Open',
                rawData: {}
            };

            try { tender.downloadableDocuments = JSON.parse(row[7] || '[]'); } catch(e) {}
            try { tender.requiredDocuments = JSON.parse(row[8] || '[]'); } catch(e) {}
            try { tender.rawData = JSON.parse(row[9] || '{}'); } catch(e) {}
            
            // Parse Eligibility Criteria - handle both array and object formats
            try {
                const eligibilityData = JSON.parse(row[10] || '{}');
                if (Array.isArray(eligibilityData)) {
                    tender.eligibilityCriteria = eligibilityData;
                } else if (typeof eligibilityData === 'object' && eligibilityData !== null) {
                    // Extract criteria from complex structured JSON
                    tender.eligibilityCriteria = formatEligibilityCriteria(eligibilityData);
                } else {
                    tender.eligibilityCriteria = [];
                }
            } catch(e) {
                tender.eligibilityCriteria = [];
            }
            
            if (row[11]) tender.status = row[11];
            if (row[12]) tender.rateSpreadsheetId = row[12];
            
            results.push(tender);
        }
        
        console.log(`Parsed ${results.length} valid tenders`);
        
        // Remove duplicates based on ID
        const uniqueMap = new Map();
        results.forEach(t => {
            if (!uniqueMap.has(t.id)) {
                uniqueMap.set(t.id, t);
            }
        });
        const uniqueResults = Array.from(uniqueMap.values());
        console.log(`After removing duplicates: ${uniqueResults.length} tenders`);
        
        return uniqueResults;
    } catch (error) {
        console.error('Error fetching tenders:', error);
        return [];
    }
}

export const calculateStats = (tenders: any[]) => {
    const totalTenders = tenders.length;
    const totalValue = tenders.reduce((acc, t) => {
        const costStr = t.estimatedCost || '0';
        const value = parseFloat(costStr.replace(/[^0-9.]/g, '')) || 0;
        return acc + value;
    }, 0);
    
    const departments = [...new Set(tenders.map(t => t.department))].length;
    const organisations = [...new Set(tenders.map(t => t.organisation))].length;
    const withEligibility = tenders.filter(t => t.eligibilityCriteria?.length > 0).length;
    const pendingCount = tenders.filter(t => t.status?.toLowerCase() === 'pending').length;

    return {
        totalTenders,
        totalValue,
        departments,
        organisations,
        withEligibility,
        pendingCount
    };
};

export const getDepartmentData = (tenders: any[]) => {
    const counts: Record<string, number> = {};
    tenders.forEach(t => {
        counts[t.department] = (counts[t.department] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
};

