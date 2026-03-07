import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // 세션 만료: 7일 (Supabase refresh token 주기와 맞춤)
              maxAge:   60 * 60 * 24 * 7,
              // JS에서 쿠키 접근 차단 (XSS 방어)
              httpOnly: true,
              // HTTPS에서만 전송 (프로덕션)
              secure:   process.env.NODE_ENV === "production",
              // CSRF 방어
              sameSite: "lax",
            })
          );
        },
      },
    }
  );

  // 세션 갱신
  const { data: { user } } = await supabase.auth.getUser();

  // 인증이 필요한 경로 보호
  const protectedPaths = ["/portfolio"];
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
