import { db } from "@repo/prisma";

export default async function Home() {
  await db.connect()
  const users = await db.orm.public.User.all();
  return (
    <main>
      <h1>Users</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </main>
  );
}