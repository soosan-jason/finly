import { LoginClient } from "@/components/auth/LoginClient";

export const metadata = {
  title: "로그인 - Finly",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  return <LoginClient searchParamsPromise={searchParams} />;
}
