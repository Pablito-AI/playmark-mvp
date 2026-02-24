import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { getAuthContext, isAdminEmail } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";
import { closeExpiredMarkets } from "@/lib/markets";

export const metadata: Metadata = {
  title: "PlayMarket",
  description: "Mercado de predicciones con puntos virtuales"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await closeExpiredMarkets();
  const user = await getAuthContext();

  return (
    <html lang="es">
      <body>
        <NavBar user={user} isAdmin={user ? isAdminEmail(user.email) : false} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">{children}</main>
      </body>
    </html>
  );
}
