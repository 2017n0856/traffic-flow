import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

async function ensureAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

type UpdateRoleBody = {
  role?: "user" | "admin";
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await ensureAdmin();
  if (!authCheck.ok) return authCheck.response;

  const body = (await request.json()) as UpdateRoleBody;
  const role = body.role;
  if (role !== "user" && role !== "admin") {
    return NextResponse.json({ error: "Role must be 'user' or 'admin'." }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const { id } = await params;

    const { error } = await admin.from("profiles").update({ role }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user role." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await ensureAdmin();
  if (!authCheck.ok) return authCheck.response;

  try {
    const admin = createServiceRoleClient();
    const { id } = await params;
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user." },
      { status: 500 },
    );
  }
}
