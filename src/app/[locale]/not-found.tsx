import Link from "next/link";
import Image from "next/image";

export default function LocaleNotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center min-h-[65vh]">
      <div className="relative mb-6">
        <Image
          src="/eureka-symbol.svg"
          alt="Eureka! Emblem"
          width={84}
          height={84}
          className="opacity-80 drop-shadow-[0_0_25px_rgba(0,196,140,0.3)]"
        />
      </div>

      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-white/5 border border-white/10 text-[#2cd4ad] mb-4">
        Errore 404 &bull; Pagina Non Trovata
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
        Ops! Questa pagina non esiste.
      </h1>

      <p className="max-w-md text-slate-400 text-sm md:text-base mb-8 leading-relaxed">
        La risorsa, il documento o la pagina che stai cercando non è disponibile o è stata spostata.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-[#1b497a] via-[#2477ad] to-[#26af90] text-white hover:opacity-95 transition-opacity shadow-lg shadow-cyan-900/30"
        >
          Torna alla Home
        </Link>
        <Link
          href="/it/academy/corsi"
          className="px-6 py-3 rounded-lg font-medium text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
        >
          Esplora i Corsi
        </Link>
      </div>
    </main>
  );
}
