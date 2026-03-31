const CSV_URL = 'https://docs.google.com/spreadsheets/d/17ozRDo5_2RCR0P2DPEb_bVKsdlS9MB6_s1N1atZ-q1Y/export?format=csv&gid=0';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatEligibilityCriteria(data: any): any[] {
    const sections: any[] = [];
    
    // Handle json_data_1 structure
    const source = data.json_data_1 || data;
    
    // Add Tender Information Section
    if (source.tender_info) {
        sections.push({
            type: 'section',
            title: 'Tender Information',
            items: [
                { label: 'Title', value: source.tender_info.title },
                { label: 'Notice Number', value: source.tender_info.notice_number },
                { label: 'Estimated Value', value: source.tender_info.estimated_value },
                { label: 'Completion Period', value: source.tender_info.completion_period },
                { label: 'Bid Validity', value: source.tender_info.bid_validity }
            ].filter(item => item.value && item.value !== 'Field Not Found')
        });
    }
    
    // Add Technical Eligibility Section
    if (source.technical_eligibility) {
        const tech = source.technical_eligibility;
        const techItems = [];
        
        if (tech.min_experience_years && tech.min_experience_years !== 'Field Not Found') {
            techItems.push({ label: 'Minimum Experience', value: tech.min_experience_years });
        }
        
        if (tech.work_completion_requirement) {
            const work = tech.work_completion_requirement;
            if (work.single_work_80_percent) techItems.push({ label: 'Experience Requirement', value: work.single_work_80_percent });
            if (work.two_works_50_percent) techItems.push({ label: 'Alternative Option', value: work.two_works_50_percent });
            if (work.three_works_40_percent) techItems.push({ label: 'Alternative Option', value: work.three_works_40_percent });
            if (work.description_of_similar_work) techItems.push({ label: 'Similar Work Description', value: work.description_of_similar_work });
        }
        
        if (tech.specific_equipment_manpower && tech.specific_equipment_manpower !== 'Field Not Found') {
            techItems.push({ label: 'Equipment & Manpower', value: tech.specific_equipment_manpower });
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
        
        if (fin.avg_annual_turnover && fin.avg_annual_turnover !== 'Field Not Found') {
            finItems.push({ label: 'Average Annual Turnover', value: fin.avg_annual_turnover });
        }
        
        if (fin.net_worth_requirement && fin.net_worth_requirement !== 'Field Not Found') {
            finItems.push({ label: 'Net Worth Requirement', value: fin.net_worth_requirement });
        }
        
        if (fin.bank_type_stipulation && fin.bank_type_stipulation !== 'Field Not Found') {
            finItems.push({ label: 'Bank Type Stipulation', value: fin.bank_type_stipulation });
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
        
        if (costs.tender_document_fee && costs.tender_document_fee !== 'Field Not Found') {
            costItems.push({ label: 'Tender Document Fee', value: costs.tender_document_fee });
        }
        
        if (costs.emd_amount && costs.emd_amount !== 'Field Not Found') {
            costItems.push({ label: 'EMD Amount', value: costs.emd_amount });
        }
        
        if (costItems.length > 0) {
            sections.push({
                type: 'section',
                title: 'Costs & Deposits',
                items: costItems
            });
        }
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

    return {
        totalTenders,
        totalValue,
        departments,
        organisations,
        withEligibility
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

