import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "AlphaStream",
  description: "Real-time stock discovery dashboard",
};

// Applies the persisted/OS theme before paint so a light-preferring visitor
// never sees a flash of the (no-longer-default) dark theme while the
// zustand store hydrates. Mirrors Providers' ThemeApplier effect exactly.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem("alphastream-theme");
    var theme = raw ? (JSON.parse(raw).state || {}).theme : "system";
    var isDark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.add(isDark ? "dark" : "light");
  } catch (e) {
    document.documentElement.classList.add(
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${instrumentSans.variable} ${plexMono.variable} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
