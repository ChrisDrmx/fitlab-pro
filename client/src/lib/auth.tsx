import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { syncNow } from "./sync";
import { adoptLocalDataFor, getMeta, setMeta, switchStoreScope } from "./store";

const LOCAL_ONLY_KEY = "localOnly";

/**
 * Session Supabase optionnelle.
 * Sans connexion, l'application reste utilisable : les fiches sont conservees
 * sur l'appareil et seront envoyees a la premiere connexion.
 */

type AuthCtx = {
  ready: boolean;
  session: Session | null;
  email: string | null;
  localOnly: boolean;
  configured: boolean;
  useLocalOnly: () => void;
  connectOnline: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!supabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [localOnly, setLocalOnly] = useState(false);

  // Le choix « travailler sans compte » est conservé sur l'appareil.
  useEffect(() => {
    void getMeta<boolean>(LOCAL_ONLY_KEY).then((v) => {
      if (v) setLocalOnly(true);
    });
  }, []);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let alive = true;
    let activation = Promise.resolve();

    const activate = (next: Session | null) => {
      activation = activation.then(async () => {
        if (!alive) return;
        if (next) {
          const adoptLocal = await getMeta<boolean>(LOCAL_ONLY_KEY);
          if (adoptLocal) await adoptLocalDataFor(next.user.id);
          else await switchStoreScope(`user:${next.user.id}`);
        } else {
          await switchStoreScope("local");
        }
        if (!alive) return;
        setSession(next);
        setReady(true);
        if (next) void syncNow();
      });
    };

    void sb.auth.getSession().then(({ data }) => activate(data.session ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => activate(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      ready,
      session,
      email: session?.user?.email ?? null,
      localOnly,
      configured: supabaseConfigured,
      useLocalOnly: () => {
        setLocalOnly(true);
        void setMeta(LOCAL_ONLY_KEY, true);
      },
      connectOnline: () => {
        setLocalOnly(false);
        void setMeta(LOCAL_ONLY_KEY, false);
      },
      signIn: async (email, password) => {
        const sb = supabase();
        if (!sb) throw new Error("Sauvegarde en ligne non configurée.");
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(traduire(error.message));
        setLocalOnly(false);
        void setMeta(LOCAL_ONLY_KEY, false);
      },
      signUp: async (email, password) => {
        const sb = supabase();
        if (!sb) throw new Error("Sauvegarde en ligne non configurée.");
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
        if (error) throw new Error(traduire(error.message));
        if (data.session) {
          setLocalOnly(false);
          void setMeta(LOCAL_ONLY_KEY, false);
          return "";
        }
        return "Compte créé. Confirme l'adresse via le lien reçu par e-mail, puis connecte-toi.";
      },
      signOut: async () => {
        const sb = supabase();
        await sb?.auth.signOut();
        await switchStoreScope("local");
        setSession(null);
        setLocalOnly(false);
      },
    }),
    [ready, session, localOnly],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return c;
}

function traduire(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Adresse e-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Adresse non confirmée : ouvre le lien reçu par e-mail.";
  if (m.includes("already registered")) return "Cette adresse a déjà un compte : connecte-toi.";
  if (m.includes("password")) return "Mot de passe trop court (6 caractères minimum).";
  if (m.includes("rate limit")) return "Trop de tentatives, patiente une minute.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Serveur injoignable : vérifie la connexion.";
  return msg;
}
