import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/kit";
import {
  Activity, ArrowLeft, ArrowRight, CalendarDays, Check, CloudOff, Dumbbell,
  GraduationCap, Loader2, Mail, ShieldCheck, Sparkles,
} from "lucide-react";

const MODULES = [
  { label: "Coaching", icon: GraduationCap, tone: "bg-[#b2d2bb] text-[#0d281e]" },
  { label: "Exercices", icon: Dumbbell, tone: "bg-[#dbe9d8] text-[#234d39]" },
  { label: "Data", icon: Activity, tone: "bg-[#6d9f78] text-[#f6f4e9]" },
  { label: "Cours", icon: Sparkles, tone: "bg-[#e9ecdf] text-[#31533d]" },
  { label: "Agenda", icon: CalendarDays, tone: "bg-[#89b394] text-[#102d21]" },
];

/** Ecran d'accueil premium : introduction glissable + connexion OTP existante. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session, localOnly, configured, useLocalOnly, sendOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [slide, setSlide] = useState(0);
  const touchStart = useRef<number | null>(null);

  if (!configured || localOnly || session) return <>{children}</>;

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-[#07150f]"><Loader2 className="h-6 w-6 animate-spin text-[#9fc5a9]" /></div>;
  }

  const move = (direction: number) => setSlide((value) => Math.max(0, Math.min(2, value + direction)));
  const onTouchStart = (event: React.TouchEvent) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
    if (Math.abs(delta) > 42) move(delta < 0 ? 1 : -1);
    touchStart.current = null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "email") {
        await sendOtp(email);
        setMode("code");
        setInfo("Un code à 6 chiffres vient d’être envoyé à ton adresse e-mail.");
      } else {
        await verifyOtp(email, code);
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07150f] text-[#f5f3e9]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col lg:flex-row">
        <section
          className="relative flex min-h-[540px] flex-1 overflow-hidden px-5 py-6 sm:px-10 lg:min-h-screen lg:px-14 lg:py-10"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label="Présentation de FitLab"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(113,170,125,0.28),transparent_34%),linear-gradient(140deg,#07150f_0%,#10291d_55%,#1c4931_100%)]" />
          <div className="pointer-events-none absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-[#7bb487]/10 blur-3xl" />
          <div className="relative z-10 flex w-full flex-col">
            <div className="flex items-center gap-3 text-[#e9eadc]">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10"><Logo className="h-6 w-6 text-[#9fc5a9]" /></span>
              <div><div className="text-sm font-semibold tracking-wide">FitLab</div><div className="text-[10px] uppercase tracking-[0.28em] text-[#9fc5a9]">Data &amp; coaching golf</div></div>
            </div>

            <div className="relative mt-8 min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black/10 shadow-2xl shadow-black/20 sm:mt-12 lg:mt-16">
              <div className="absolute inset-0 opacity-45" style={{ backgroundImage: "url('/fitlab-brand.jpg')", backgroundSize: "cover", backgroundPosition: "center 36%" }} />
              <div className="absolute inset-0 bg-gradient-to-b from-[#08150f]/10 via-[#08150f]/35 to-[#08150f]/95" />
              <div className="relative flex h-full min-h-[420px] flex-col justify-end p-6 sm:p-10 lg:min-h-[620px] lg:p-12">
                <div className="mb-auto pt-8 text-xs uppercase tracking-[0.32em] text-[#b2d2bb]">Analyse · Progression · Performance</div>
                <div className="overflow-hidden">
                  <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${slide * 100}%)` }}>
                    <IntroSlide key="welcome" title="Votre golf, enfin lisible." text="Un espace clair pour comprendre vos séances, suivre vos exercices et progresser avec votre pro." />
                    <IntroSlide key="modules" title="Tout votre parcours au même endroit." text="Coaching, exercices, data, cours et agenda réunis dans une expérience simple et premium." modules />
                    <IntroSlide key="progress" title="Chaque séance compte." text="Vos priorités et votre évolution prennent vie dans des indicateurs visuels et faciles à comprendre." progress />
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2" aria-label={`Page ${slide + 1} sur 3`}>
                    {[0, 1, 2].map((item) => <button key={item} type="button" aria-label={`Aller à la page ${item + 1}`} onClick={() => setSlide(item)} className={`h-1.5 rounded-full transition-all ${item === slide ? "w-9 bg-[#dfead7]" : "w-1.5 bg-white/30"}`} />)}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="icon" variant="ghost" aria-label="Page précédente" onClick={() => move(-1)} disabled={slide === 0} className="rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20"><ArrowLeft className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="Page suivante" onClick={() => move(1)} disabled={slide === 2} className="rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20"><ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-white/45 lg:text-left">Fitting · coaching · Trackman · suivi joueur</p>
          </div>
        </section>

        <section className="relative flex w-full items-center bg-[#f4f3eb] px-5 py-10 text-[#12271d] sm:px-10 lg:max-w-[510px] lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden"><img src="/fitlab-brand.jpg" alt="FitLab" className="h-14 w-14 rounded-2xl object-cover object-top" /><div><div className="font-semibold">FitLab</div><div className="text-xs text-[#5f7868]">Data &amp; coaching golf</div></div></div>
            <div className="mb-8"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#dcebdd] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#315b40]"><Mail className="h-3.5 w-3.5" /> Accès membre</div><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{mode === "email" ? "Bienvenue dans votre espace." : "Vérifiez votre adresse."}</h1><p className="mt-3 text-sm leading-6 text-[#607467]">{mode === "email" ? "Connectez-vous pour retrouver vos cours, vos exercices et votre progression sur tous vos appareils." : "Entre le code reçu par e-mail pour ouvrir ton espace FitLab."}</p></div>
            <Card className="border-[#d8e1d4] bg-white/75 p-5 shadow-xl shadow-[#294c35]/10 backdrop-blur sm:p-6">
              <form onSubmit={submit} className="space-y-4">
                <Field label="Adresse e-mail"><Input type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="toi@example.com" className="h-12 border-[#cbd8c9] bg-white" data-testid="input-auth-email" required disabled={mode === "code"} /></Field>
                {mode === "code" ? <Field label="Code reçu par e-mail" hint="6 chiffres — valable quelques minutes"><Input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="h-12 border-[#cbd8c9] bg-white text-center font-mono text-lg tracking-[0.35em]" data-testid="input-auth-code" pattern="[0-9]{6}" maxLength={6} required /></Field> : null}
                {err ? <p className="rounded-xl bg-[#fbe7e4] px-3 py-2.5 text-xs text-[#b23b2e]" data-testid="text-auth-error">{err}</p> : null}
                {info ? <p className="rounded-xl bg-[#e3f1e3] px-3 py-2.5 text-xs text-[#28633e]" data-testid="text-auth-info">{info}</p> : null}
                <Button type="submit" className="h-12 w-full rounded-xl bg-[#1e6442] text-[#f8f7ef] shadow-lg shadow-[#1e6442]/20 hover:bg-[#174d32]" disabled={busy} data-testid="button-auth-submit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "email" ? "Recevoir mon code" : "Valider le code"}</Button>
                {mode === "code" ? <div className="flex items-center justify-between gap-3 text-xs text-[#607467]"><button type="button" className="inline-flex items-center gap-1 hover:text-[#1e6442]" onClick={() => { setMode("email"); setCode(""); setErr(""); setInfo(""); }} data-testid="button-auth-back"><ArrowLeft className="h-3.5 w-3.5" /> Modifier l’e-mail</button><button type="button" className="hover:text-[#1e6442]" onClick={() => { setErr(""); setInfo(""); void sendOtp(email).then(() => setInfo("Un nouveau code a été envoyé."), (error) => setErr(error instanceof Error ? error.message : "Envoi impossible.")); }} data-testid="button-auth-resend">Renvoyer le code</button></div> : null}
              </form>
            </Card>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#dce5d9] bg-[#eaf1e7]/65 p-4 text-xs leading-5 text-[#607467]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#42805a]" /><span>Vos données restent protégées et synchronisées uniquement avec votre compte.</span></div>
            <Button variant="ghost" size="sm" className="mt-5 w-full gap-2 text-[#607467] hover:bg-[#e8eee5] hover:text-[#1e6442]" onClick={useLocalOnly} data-testid="button-auth-local"><CloudOff className="h-4 w-4" /> Découvrir sans compte, sur cet appareil</Button>
          </div>
        </section>
      </div>
    </main>
  );
}

function IntroSlide({ title, text, modules = false, progress = false }: { title: string; text: string; modules?: boolean; progress?: boolean }) {
  return <div className="min-w-full pr-8"><div className="max-w-xl"><h2 className="text-3xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#f7f5e9] sm:text-5xl">{title}</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#dbe7d8]/75 sm:text-base">{text}</p></div>{modules ? <div className="mt-7 flex max-w-md flex-wrap gap-2">{MODULES.map(({ label, icon: Icon, tone }) => <div key={label} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${tone}`}><Icon className="h-3.5 w-3.5" />{label}</div>)}</div> : null}{progress ? <div className="mt-7 flex items-end gap-3"><div className="grid h-24 w-24 place-items-center rounded-full border border-[#c9e1c8]/50 bg-[#8ab894]/20"><div className="text-2xl font-semibold text-[#eff4e8]">72%</div></div><div className="space-y-2"><div className="flex items-center gap-2 text-xs text-[#dbe7d8]/80"><Check className="h-3.5 w-3.5 text-[#a8d5aa]" /> Objectif de séance</div><div className="flex items-center gap-2 text-xs text-[#dbe7d8]/80"><Check className="h-3.5 w-3.5 text-[#a8d5aa]" /> Exercice de la semaine</div></div></div> : null}</div>;
}
