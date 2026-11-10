import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { trialDaysLeft, type CompanyRow } from "@/lib/tenant";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function buildCheckoutUrl(base: string, email?: string | null, companyId?: string | null) {
  try {
    const u = new URL(base);
    if (email) u.searchParams.set("email", email);
    if (companyId) u.searchParams.set("ref", companyId);
    return u.toString();
  } catch {
    return base;
  }
}

export function TrialBanner({ company }: { company: CompanyRow }) {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const isTrial = company.status_cobranca === "trial";
  const planSlug = (company as any).selected_plan_slug as string | null | undefined;

  useEffect(() => {
    if (!isTrial) return;
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      let q = supabase.from("plan").select("slug, checkout_url, destaque, ordem").eq("ativo", true);
      const { data: plans } = await q.order("ordem");
      const list = plans ?? [];
      const plan = list.find((p) => p.slug === planSlug) ?? list.find((p) => p.destaque) ?? list[0];
      if (alive && plan?.checkout_url) {
        setCheckoutUrl(buildCheckoutUrl(plan.checkout_url, u.user?.email, company.id));
      }
    })();
    return () => { alive = false; };
  }, [isTrial, planSlug, company.id]);

  if (!isTrial) return null;
  const days = trialDaysLeft(company.trial_ate);
  const btnClass =
    "ml-2 inline-flex items-center rounded-md bg-white/15 hover:bg-white/25 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-white/30";

  return (
    <div className="px-4 py-2.5 text-sm flex flex-wrap items-center justify-center gap-2 bg-red-600 text-white border-b border-red-700 font-medium">
      <AlertTriangle className="size-4 shrink-0" />
      <span>
        {days > 0 ? (
          <>Teste grátis — {days === 1 ? "resta" : "restam"} <b>{days} {days === 1 ? "dia" : "dias"}</b>. Regularize sua assinatura para não perder o acesso.</>
        ) : (
          <>Seu período de teste terminou. Ative seu plano para continuar.</>
        )}
      </span>
      {checkoutUrl ? (
        <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
          Regularizar agora
        </a>
      ) : (
        <Link to="/app/checkout" className={btnClass}>Ativar plano</Link>
      )}
    </div>
  );
}
