import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL") {
  const value = process.env[name];
  if (!value) {
    throw new Error("Missing Supabase env var: NEXT_PUBLIC_SUPABASE_URL.");
  }
  return value;
}

function getRequiredPublicKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(
      "Missing Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return value;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabasePublicKey = getRequiredPublicKey();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(
            name,
            value,
            options as Parameters<typeof response.cookies.set>[2],
          ),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDashboardPath =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isReportIncidentPath =
    pathname === "/report-incident" || pathname.startsWith("/report-incident/");
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isUserPath = isDashboardPath || isReportIncidentPath;

  if ((isUserPath || isAdminPath) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isUserPath || isAdminPath)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    const isAdmin = profile?.role === "admin";

    if (isAdminPath && !isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }

    if (isUserPath && isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
