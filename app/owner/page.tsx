import { redirect } from 'next/navigation';

/** Short, memorable entry point for the owner-only creator workspace. */
export default function OwnerPage() {
  redirect('/studio');
}
