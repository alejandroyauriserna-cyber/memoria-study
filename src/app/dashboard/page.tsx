import { redirect } from "next/navigation";

/** Compatibilidad: el inicio unificado vive en `/`. */
export default function DashboardPage() {
  redirect("/");
}
