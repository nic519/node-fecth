import { redirect } from 'next/navigation';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { superToken, superAdminToken } = await searchParams;
  const token = superToken || superAdminToken;
  
  if (token) {
    redirect(`/admin/dashboard?superToken=${token}`);
  } else {
    redirect('/admin/dashboard');
  }
}
