import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { createCoaching, deleteCoaching, listCoachings, listFittings, type Fitting } from "@/lib/store";
import { emptyCoaching } from "@/lib/types";
import { Layout, PageHeader } from "@/components/layout";
import { Field } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronRight, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Student = { key: string; firstName: string; lastName: string; email: string };

function studentsFromFittings(fittings: Fitting[] | undefined): Student[] {
  const map = new Map<string, Student>();
  for (const fitting of fittings ?? []) {
    try {
      const player = JSON.parse(fitting.data)?.player ?? {};
      const firstName = String(player.firstName ?? "").trim();
      const lastName = String(player.lastName ?? "").trim();
      const email = String(player.email ?? "").trim();
      const name = `${firstName} ${lastName}`.trim();
      if (!name && !email) continue;
      const key = email.toLowerCase() || name.toLowerCase();
      if (!map.has(key)) map.set(key, { key, firstName, lastName, email });
    } catch { /* ancienne fiche mal formée */ }
  }
  return [...map.values()].sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`));
}

export default function CoachingDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [studentChoice, setStudentChoice] = useState("new");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: coachings, isLoading } = useQuery({ queryKey: ["coachings"], queryFn: listCoachings });
  const { data: fittings } = useQuery({ queryKey: ["fittings"], queryFn: listFittings });
  const students = useMemo(() => studentsFromFittings(fittings), [fittings]);

  const create = useMutation({
    mutationFn: async () => {
      const selected = students.find((s) => s.key === studentChoice);
      const student = selected ?? { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() };
      if (!student.firstName.trim() || !student.lastName.trim() || !student.email.includes("@")) {
        throw new Error("Le prénom, le nom et une adresse e-mail valide sont requis.");
      }
      const data = emptyCoaching();
      data.student.firstName = student.firstName;
      data.student.lastName = student.lastName;
      data.student.email = student.email;
      data.date = date;
      return createCoaching({
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        studentEmail: student.email,
        date,
        status: "en_cours",
        data,
      });
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["coachings"] });
      setOpen(false);
      setStudentChoice("new"); setFirstName(""); setLastName(""); setEmail("");
      navigate(`/coaching/${row.id}`);
    },
    onError: () => toast({ title: "Création impossible", description: "Renseigne au minimum le nom, le prénom et l'adresse e-mail.", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: deleteCoaching,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coachings"] }),
  });
  const selectedExisting = studentChoice !== "new";
  const existingStudent = students.find((s) => s.key === studentChoice);
  const canCreate = selectedExisting
    ? Boolean(existingStudent?.firstName.trim() && existingStudent.lastName.trim() && existingStudent.email.includes("@"))
    : Boolean(firstName.trim() && lastName.trim() && email.trim().includes("@"));

  return (
    <Layout>
      <PageHeader
        title="Cours de coaching"
        subtitle="Commentaires du pro, recommandations modifiables, exercices et rapport élève"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau cours</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Nouveau cours de coaching</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Field label="Élève existant ou nouveau">
                  <Select value={studentChoice} onValueChange={(value) => {
                    setStudentChoice(value);
                    const selected = students.find((s) => s.key === value);
                    if (selected) { setFirstName(selected.firstName); setLastName(selected.lastName); setEmail(selected.email); }
                    else { setFirstName(""); setLastName(""); setEmail(""); }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Choisir un élève" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nouvel élève</SelectItem>
                      {students.map((s) => <SelectItem key={s.key} value={s.key}>{`${s.firstName} ${s.lastName}`.trim()} {s.email ? `· ${s.email}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Prénom *"><Input value={firstName} disabled={selectedExisting} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" /></Field>
                  <Field label="Nom *"><Input value={lastName} disabled={selectedExisting} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" /></Field>
                </div>
                <Field label="Adresse e-mail *"><Input type="email" value={email} disabled={selectedExisting} onChange={(e) => setEmail(e.target.value)} placeholder="eleve@example.com" /></Field>
                <Field label="Date du cours"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                <p className="text-xs text-muted-foreground">L'objectif, la durée et les notes du pro se complètent dans la fiche du cours.</p>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!canCreate || create.isPending}>{create.isPending ? "Création…" : "Démarrer le cours"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-4 md:p-6">
        {isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : !coachings?.length ? (
          <Card className="flex flex-col items-center gap-3 border-dashed border-card-border px-6 py-14 text-center">
            <GraduationCap className="h-9 w-9 text-muted-foreground/50" />
            <div><p className="font-medium">Aucun cours de coaching</p><p className="mt-1 text-sm text-muted-foreground">Crée un cours, colle les commentaires du pro et construis le plan de travail de l'élève.</p></div>
            <Button variant="outline" className="mt-2 gap-2" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau cours</Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {coachings.map((c) => (
              <Card key={c.id} className="group cursor-pointer border-card-border p-4 hover-elevate" onClick={() => navigate(`/coaching/${c.id}`)}>
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-semibold">{c.studentName}</div><div className="mt-0.5 font-mono text-xs text-muted-foreground">{c.date ? new Date(`${c.date}T12:00:00`).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" }) : "Date à compléter"}</div></div><Badge variant={c.status === "termine" ? "default" : "outline"}>{c.status === "termine" ? "Terminé" : "En cours"}</Badge></div>
                <div className="mt-4 flex items-center justify-between"><span className="truncate text-sm text-muted-foreground">{c.studentEmail || "E-mail à compléter"}</span><div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); remove.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
