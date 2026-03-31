import { getTenders, calculateStats } from '@/lib/data-provider';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
    const tenders = await getTenders();
    const stats = calculateStats(tenders);

    return <DashboardContent tenders={tenders} stats={stats} />;
}

