import { redirect } from "next/navigation";

// Tonight is the landing page (Phase R4, docs/PRODUCT_RESET.md §3).
export default function Home() {
  redirect("/tonight");
}
