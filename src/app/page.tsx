import type { Metadata } from "next";
import { HomeRedirect } from "@/components/auth/HomeRedirect";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return <HomeRedirect />;
}
