import { db } from "@repo/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await db.orm.public.User.all();

  return (
    <main>
      <h1>Users</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </main>
  );
}
