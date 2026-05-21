import { LoginForm } from '@/modules/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next ?? '/dashboard'} />;
}
