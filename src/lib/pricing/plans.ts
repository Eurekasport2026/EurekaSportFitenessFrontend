export interface PricingPlan {
  name: "Base" | "Pro" | "Elite";
  subtitle: string;
  monthly: number;
  features: string[];
}

/** Existing client-reference pricing shared by marketing and the workout preview. */
export const pricingPlans: PricingPlan[] = [
  { name: "Base", subtitle: "Ideale per iniziare", monthly: 9.99, features: ["Programmi base", "Video esercizi", "Monitoraggio progressi", "Supporto via email"] },
  { name: "Pro", subtitle: "Il più scelto", monthly: 14.99, features: ["Programmi personalizzati", "Tutti i video esercizi", "Statistiche avanzate", "Supporto prioritario", "Nuovi contenuti mensili"] },
  { name: "Elite", subtitle: "Senza limiti", monthly: 24.99, features: ["Tutto quello del piano Pro", "Programma su misura", "Consulenza con coach", "Piani nutrizionali", "Accesso anticipato novità"] },
];

export function monthlyPrice(plan: PricingPlan, annual: boolean) {
  return annual ? Math.round(plan.monthly * 80) / 100 : plan.monthly;
}
