import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const seedUsers = [
  { email: "user@gmail.com", password: "Password@123", role: "user", fullName: "Standard User" },
  { email: "admin@gmail.com", password: "Password@123", role: "admin", fullName: "Admin User" },
];

async function findUserByEmail(email) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(error.message);
    const users = data.users ?? [];
    const match = users.find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < 100) break;
    page += 1;
  }
  return null;
}

async function upsertSeedUser(seed) {
  const existing = await findUserByEmail(seed.email);
  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      email: seed.email,
      password: seed.password,
      email_confirm: true,
      user_metadata: { full_name: seed.fullName },
    });
    if (updateError) throw new Error(updateError.message);

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        { id: existing.id, email: seed.email, role: seed.role },
        { onConflict: "id" },
      );
    if (profileError) throw new Error(profileError.message);
    return;
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
    user_metadata: { full_name: seed.fullName },
  });
  if (createError) throw new Error(createError.message);
  if (!data.user) throw new Error(`Unable to create ${seed.email}`);

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      { id: data.user.id, email: seed.email, role: seed.role },
      { onConflict: "id" },
    );
  if (profileError) throw new Error(profileError.message);
}

for (const seed of seedUsers) {
  await upsertSeedUser(seed);
  console.log(`Seeded ${seed.email} (${seed.role}).`);
}

console.log("User seed complete.");
