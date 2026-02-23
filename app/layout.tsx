import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { getAuthContext, isAdminEmail } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";
import { closeExpiredMarkets } from "@/lib/markets";

export const metadata: Metadata = {
  title: "PlayMarket",
  description: "Prediction market MVP using play money points"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await closeExpiredMarkets();
  const user = await getAuthContext();

  return (
    <html lang="en">
      <body>
        <NavBar user={user} isAdmin={user ? isAdminEmail(user.email) : false} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
