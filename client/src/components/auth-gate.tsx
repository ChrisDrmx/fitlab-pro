import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/kit";
import { Loader2, CloudOff, ShieldCheck, ArrowLeft } from "lucide-react";

/**
 * Ecran de connexion. La sauvegarde en ligne est optionnelle : on peut toujours
 * travailler en local sur l'appareil et synchroniser plus tard.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session, localOnly, configured, useLocalOnly, sendOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  if (!configured || localOnly || session) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="h-10 w-auto" />
        <p className="text-base font-semibold tracking-tight">FitLab Pro</p>
        <p className="text-sm text-muted-foreground">Fitting fers &amp; bois — diagnostic et rapport client</p>
      </div>

      <Card className="w-full max-w-sm border-card-border p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">
              {mode === "email" ? "Connexion par e-mail" : "Vérifier le code"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Entre ton adresse e-mail : aucun mot de passe n’est nécessaire.
            </p>
          </div>

          <Field label="Adresse e-mail">
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chris@myswingcloud.com"
              className="h-11"
              data-testid="input-auth-email"
              required
              disabled={mode === "code"}
            />
          </Field>
          {mode === "code" ? (
            <Field label="Code reçu par e-mail" hint="6 chiffres — valable quelques minutes">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="h-11 text-center font-mono text-lg tracking-[0.35em]"
                data-testid="input-auth-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </Field>
          ) : null}

          {err ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="text-auth-error">
              {err}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary" data-testid="text-auth-info">
              {info}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={busy} data-testid="button-auth-submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "email" ? "Recevoir mon code" : "Valider le code"}
          </Button>

          {mode === "code" ? (
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <button
                type="button"
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                onClick={() => { setMode("email"); setCode(""); setErr(""); setInfo(""); }}
                data-testid="button-auth-back"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Modifier l’e-mail
              </button>
              <button
                type="button"
                className="underline-offset-2 hover:underline"
                onClick={() => { setErr(""); setInfo(""); void sendOtp(email).then(() => setInfo("Un nouveau code a été envoyé."), (e) => setErr(e instanceof Error ? e.message : "Envoi impossible.")); }}
                data-testid="button-auth-resend"
              >
                Renvoyer le code
              </button>
            </div>
          ) : null}
        </form>
      </Card>

      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <Button variant="ghost" size="sm" className="gap-2" onClick={useLocalOnly} data-testid="button-auth-local">
          <CloudOff className="h-4 w-4" /> Travailler sans compte, sur cet appareil
        </Button>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Les fiches créées hors connexion restent sur l'appareil et seront envoyées dès la première connexion.
        </p>
      </div>
    </div>
  );
}
