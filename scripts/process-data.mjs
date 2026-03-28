import fs from 'fs';
import path from 'path';

async function processData() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/17ozRDo5_2RCR0P2DPEb_bVKsdlS9MB6_s1N1atZ-q1Y/export?format=csv&gid=0';
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        const lines = csvData.split('\n');
        
        // CSV header parsing
        const headers = [];
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
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const row = [];
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
                    row.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current);

            if (row.length < headers.length) continue;

            const tender = {
                id: row[0],
                name: row[1],
                organisation: row[2],
                estimatedCost: row[3],
                department: row[4],
                subDepartment: row[5],
                submissionDate: row[6],
                downloadableDocuments: [],
                requiredDocuments: [],
                rawData: {}
            };

            try { tender.downloadableDocuments = JSON.parse(row[7] || '[]'); } catch(e) {}
            try { tender.requiredDocuments = JSON.parse(row[8] || '[]'); } catch(e) {}
            try { tender.rawData = JSON.parse(row[9] || '{}'); } catch(e) {}
            
            results.push(tender);
        }

        const dataDir = 'c:/Users/Admin/Desktop/clg/Projects/Tender/dashboard/src/data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const dataPath = path.join(dataDir, 'tenders.json');
        fs.writeFileSync(dataPath, JSON.stringify(results, null, 2));
        console.log(`Processed ${results.length} tenders.`);
    } catch (error) {
        console.error('Error processing data:', error);
    }
}

processData();
