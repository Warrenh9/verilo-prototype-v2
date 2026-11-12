import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Card, EmptyState, PageHeader } from "../components/ui";

export function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" />
      <Card><EmptyState icon={Compass} title="That address doesn't match a page in Verilo Qualify" action={<Link to="/" className="text-brand-ink hover:underline">Go to Overview</Link>} /></Card>
    </>
  );
}
