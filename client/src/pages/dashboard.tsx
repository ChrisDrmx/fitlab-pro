import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { listFittings, createFitting, deleteFitting, type Fitting } from "@/lib/store";
import { useLocation } from "wouter";
import { Layout, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/kit";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronRight, Target, Archive } from "lucide-react";
import { emptyFitting } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const BRANDS = ["PING", "Callaway", "Cobra", "TaylorMade", "Titleist", "Mizuno", "Srixon", "PXG", "Multi-marques"];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("PING");

  const { data: fittings, isLoading } = useQuery<(Fitting & { reportCount?: number })[]>({
    queryKey: ["fittings"],
    queryFn: () => listFittings(),
  });

  const create = useMutation({
    mutationFn: async () => {
      const data = emptyFitting();
      const parts = name.trim().split(" ");
      data.player.firstName = parts[0] ?? "";
      data.player.lastName = parts.slice(1).join(" ");
      data.targetBrand = brand;
      return createFitting({
        playerName: name.trim(),
        date: new Date().toISOString().slice(0, 10),
        status: "en_cours",
        brand,
        data: JSON.stringify(data),
      });
    },
    onSuccess: (f) => {
      queryClient.invalidateQueries({ queryKey: ["fittings"] });
      setOpen(false);
      setName("");
      navigate(`/fitting/${f.id}`);
    },
    onError: () => toast({ title: "Création impossible", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFitting(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fittings"] }),
  });

  return (
    <Layout>
      <PageHeader
        title="Fiches de fitting"
        subtitle="Diagnostic fers &amp; bois — mesures, lie dynamique, Trackman, rapport client"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-fitting" className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau fitting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nouvelle fiche de fitting</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Field label="Nom du joueur">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom Nom"
                    data-testid="input-player-name"
                    className="h-11 md:h-9"
                  />
                </Field>
                <Field label="Marque de référence" hint="Marques travaillées par Drohme : PING, Callaway, Cobra">
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger data-testid="select-brand" className="h-11 md:h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!name.trim() || create.isPending}
                  data-testid="button-create-fitting"
                >
                  {create.isPending ? "Création…" : "Démarrer le fitting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !fittings?.length ? (
          <Card className="flex flex-col items-center gap-3 border-dashed border-card-border px-6 py-14 text-center">
            <Target className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="font-medium">Aucune fiche pour le moment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crée une fiche pour lancer un diagnostic complet : mesures statiques, lie board, données Trackman et rapport PDF.
              </p>
            </div>
            <Button onClick={() => setOpen(true)} variant="outline" className="mt-2 gap-2" data-testid="button-empty-new">
              <Plus className="h-4 w-4" /> Nouveau fitting
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {fittings.map((f) => {
              let hcp = "";
              try { hcp = JSON.parse(f.data)?.player?.handicap ?? ""; } catch { /* ignore */ }
              return (
                <Card
                  key={f.id}
                  className="group cursor-pointer border-card-border p-4 hover-elevate"
                  onClick={() => navigate(`/fitting/${f.id}`)}
                  data-testid={`card-fitting-${f.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold" data-testid={`text-name-${f.id}`}>{f.playerName}</div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {new Date(f.date).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" })}
                        {hcp ? ` · index ${hcp}` : ""}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{f.brand || "—"}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={f.status === "termine" ? "default" : "outline"}>
                        {f.status === "termine" ? "Terminé" : "En cours"}
                      </Badge>
                      {f.reportCount ? (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-reports-${f.id}`}>
                          <Archive className="h-3 w-3" />
                          {f.reportCount} rapport{f.reportCount > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-${f.id}`}
                        onClick={(e) => { e.stopPropagation(); remove.mutate(f.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
