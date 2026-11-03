import { redirect } from "next/navigation";

/**
 * Phase R2: the Book (/book) replaced Portfolio. This page read the
 * recommendations engine's own positions file, which nothing else uses and
 * which was empty while the engine's ledger held 30 open rows.
 */
export default function PortfolioPage() {
  redirect("/book");
}
