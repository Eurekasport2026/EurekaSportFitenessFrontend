import type { HomeIconProps } from "@/components/features/home/HomeIcon";

export interface MarketingBenefit {
  icon: HomeIconProps["name"];
  title: string;
  description: string;
}

export interface MarketingCard {
  title: string;
  description?: string;
  imageAlt: string;
  tile: number;
  slug?: string;
}

export const academyBenefits: MarketingBenefit[] = [
  { icon: "certificate", title: "Diplomi e certificazioni", description: "Riconosciuti e spendibili a livello nazionale" },
  { icon: "practice", title: "Formazione pratica", description: "Impara sul campo" },
  { icon: "people", title: "Docenti esperti", description: "Professionisti del settore" },
  { icon: "support", title: "Supporto continuo", description: "Anche dopo il corso" },
];

export const trainingBenefits: MarketingBenefit[] = [
  { icon: "medal", title: "Programmi per tutti", description: "Principianti e avanzati" },
  { icon: "video", title: "Video esercizi HD", description: "Spiegazioni chiare" },
  { icon: "growth", title: "Monitoraggio risultati", description: "Segui i tuoi progressi" },
  { icon: "location", title: "Allenati ovunque", description: "Palestra, casa, outdoor" },
];

export const academyCourses: MarketingCard[] = [
  { title: "Personal Trainer", description: "Diventa un professionista del fitness", imageAlt: "Personal trainer con un manubrio in palestra", tile: 0, slug: "personal-trainer-1" },
  { title: "Calisthenics Coach", description: "Teoria e pratica del movimento a corpo libero", imageAlt: "Atleta durante un esercizio di calisthenics", tile: 1, slug: "calisthenics-1" },
  { title: "Istruttore Nuoto", description: "Formazione completa per il mondo acquatico", imageAlt: "Nuotatore con cuffia e occhialini in piscina", tile: 2 },
  { title: "Aquagym e Hydrobike", description: "Specializzati nel fitness in acqua", imageAlt: "Allenamento di aquagym in piscina", tile: 3 },
  { title: "Ginnastica", description: "Tecnica, didattica e programmazione", imageAlt: "Ginnasta impegnata nello stretching a terra", tile: 4 },
];

export const trainingGoals: MarketingCard[] = [
  { title: "Dimagrimento", imageAlt: "Atleta in abbigliamento da allenamento", tile: 5 },
  { title: "Massa muscolare", imageAlt: "Atleta e sviluppo muscolare", tile: 6 },
  { title: "Forza", imageAlt: "Allenamento della forza con il bilanciere", tile: 7 },
  { title: "Mobilità", imageAlt: "Esercizio di mobilità su un tappetino", tile: 8 },
  { title: "Calisthenics", imageAlt: "Allenamento a corpo libero all'aperto", tile: 9 },
  { title: "Benessere", imageAlt: "Meditazione all'aperto in posizione seduta", tile: 10 },
];
