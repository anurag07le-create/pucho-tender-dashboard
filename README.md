# Tender Dashboard

A modern dashboard for tracking and analyzing tenders fetched from Google Sheets.

## Features

- Real-time data sync with Google Sheets
- Interactive charts (Chart.js)
- Responsive design
- Detailed tender views

## Setup & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/anurag07le-create/pucho-tender-dashboard.git
   cd tender-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the dashboard**: Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Source

The dashboard fetches data from a public Google Sheet export URL defined in `src/lib/data-provider.ts`. No environment variables are currently required for this basic setup.

## Project Structure

- `src/app`: Next.js pages and layouts.
- `src/components`: UI components (Dashboard, Chart, Modals).
- `src/lib`: Data fetching and utility logic.
- `raw_tenders.csv`: Local backup of tender data.
- `scripts/`: Data processing scripts.
