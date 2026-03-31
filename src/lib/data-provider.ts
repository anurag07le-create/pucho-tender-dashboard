const CSV_URL = 'https://docs.google.com/spreadsheets/d/17ozRDo5_2RCR0P2DPEb_bVKsdlS9MB6_s1N1atZ-q1Y/export?format=csv&gid=0';

export async function getTenders() {
    try {
        const response = await fetch(CSV_URL, { next: { revalidate: 300 } });
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
            try { tender.eligibilityCriteria = JSON.parse(row[10] || '[]'); } catch(e) {}
            if (row[11]) tender.status = row[11];
            
            results.push(tender);
        }
        
        console.log(`Parsed ${results.length} valid tenders`);
        return results;
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

