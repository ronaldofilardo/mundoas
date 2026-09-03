import { redirect } from "next/navigation";

export default function ComissionamentoEquipePage() {
  redirect("/backoffice/equipe/cadastro?tab=gestores");
}