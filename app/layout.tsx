import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ostavo Audit Workbench",
  description: "Internal workbench for producing Website Cleanup Audits.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-ink">
                Ostavo Audit Workbench
              </span>
              <span className="text-xs text-muted">
                Cleaner websites. Clearer business.
              </span>
            </Link>
            <Link
              href="/audits/new"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-ink"
            >
              New audit
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

        <footer className="mx-auto max-w-5xl px-6 pb-12 pt-4 text-xs text-muted">
          Internal tool — not customer facing. Built for the first 10 paid audits.
        </footer>
      </body>
    </html>
  );
}
