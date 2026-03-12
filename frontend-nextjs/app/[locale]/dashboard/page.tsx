import { PublicPlaceholder } from '@/components/public-placeholder';

export default function DashboardPage() {
  return (
    <PublicPlaceholder
      title="Dashboard flow removed in public repository"
      description="The dashboard remains part of the route structure, but its authenticated business logic is intentionally not included in this public showcase."
    />
  );
}
