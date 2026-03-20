import { fetchAlerts, computePayload } from "@/lib/alerts";
import Dashboard from "@/components/Dashboard";

export const revalidate = 3600;

export default async function Home() {
  const alerts = await fetchAlerts();
  const payload = computePayload(alerts);

  return <Dashboard initial={payload} />;
}
