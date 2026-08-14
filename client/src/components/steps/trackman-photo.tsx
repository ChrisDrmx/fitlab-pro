import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Loader2, AlertTriangle, ScanLine } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CLUB_LABEL, IRON_CLUBS, WOOD_CLUBS } from "@/lib/types";
import type { ClubKey, TrackmanRow } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL: ClubKey[] = [...WOOD_CLUBS, ...IRON_CLUBS];

const PREVIEW: { key: keyof TrackmanRow; label: string }[] = [
  { key: "clubSpeed", label: "Vit. club" },
  { key: "ballSpeed", label: "Vit. balle" },
  { key: "smash", label: "Smash" },
  { key: "launch", label: "Départ" },
  { key: "spin", label: "Spin" },
  { key: "attackAngle", label: "Attaque" },
  { key: "dynamicLoft", label: "Loft dyn." },
  { key: "clubPath", label: "Path" },
  { key: "faceToPath", label: "F-to-P" },
  { key: "carry", label: "Carry" },
  { key: "total", label: "Total" },
];

const UNIT_LABEL: Record<string, string> = {
  mph: "mph", kmh: "km/h", ms: "m/s",
  yards: "yards", meters: "mètres", feet: "pieds",
};

/** Réduit la photo à 1600 px de large max et la convertit en JPEG pour l'envoi. */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas indisponible"));
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
    img.src = url;
  });
}

function emptyRow(club: ClubKey): TrackmanRow {
  return {
    club, clubSpeed: "", ballSpeed: "", smash: "", launch: "", spin: "",
    attackAngle: "", dynamicLoft: "", spinLoft: "", faceAngle: "", clubPath: "",
    faceToPath: "", height: "", landingAngle: "", carry: "", total: "", sideCarry: "",
    impactHoriz: "", impactVert: "",
  };
}

export function TrackmanPhotoImport({ onImport }: { onImport: (rows: TrackmanRow[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [units, setUnits] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<TrackmanRow[]>([]);
  const [keep, setKeep] = useState<boolean[]>([]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const image = await compress(file);
      setPreview(image);
      const res = await apiRequest("POST", "/api/trackman-ocr", { image });
      const data = (await res.json()) as {
        rows: Partial<TrackmanRow>[]; source: string; detectedUnits: Record<string, string>;
      };
      if (!data.rows?.length) {
        setError("Aucune donnée de launch monitor détectée sur cette image. Cadrez le tableau de chiffres bien à plat et évitez les reflets.");
        setBusy(false);
        return;
      }
      const parsed = data.rows.map((r) => ({ ...emptyRow((r.club as ClubKey) || "7i"), ...r } as TrackmanRow));
      setRows(parsed);
      setKeep(parsed.map(() => true));
      setSource(data.source ?? "");
      setUnits(data.detectedUnits ?? {});
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture de l'image impossible.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirm = () => {
    onImport(rows.filter((_, i) => keep[i]));
    setOpen(false);
    setRows([]);
    setPreview(null);
  };

  const nKeep = keep.filter(Boolean).length;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="input-tm-photo"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        data-testid="button-tm-photo"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        {busy ? "Lecture…" : "Photo"}
      </Button>

      {error && (
        <p className="mt-2 flex w-full items-start gap-1.5 text-xs text-destructive" data-testid="text-tm-photo-error">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              Vérifier les données lues
            </DialogTitle>
            <DialogDescription>
              {source || "Données extraites de la photo"}. Contrôlez chaque valeur avant de l'insérer dans la fiche : une lecture d'image reste faillible.
            </DialogDescription>
          </DialogHeader>

          {(units.speed || units.distance) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {units.speed && (
                <Badge variant="secondary">
                  {units.speed === "mph"
                    ? "Vitesses en mph"
                    : `Vitesses lues en ${UNIT_LABEL[units.speed] ?? units.speed}, converties en mph`}
                </Badge>
              )}
              {units.distance && (
                <Badge variant="secondary">
                  {units.distance === "meters"
                    ? "Distances en mètres"
                    : `Distances lues en ${UNIT_LABEL[units.distance] ?? units.distance}, converties en mètres`}
                </Badge>
              )}
            </div>
          )}

          {preview && (
            <img
              src={preview}
              alt="Photo importée"
              className="max-h-40 w-full rounded-md border border-border object-contain"
            />
          )}

          <div className="space-y-3">
            {rows.map((r, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 ${keep[i] ? "border-border" : "border-dashed border-border opacity-50"}`}
                data-testid={`row-ocr-${i}`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <Checkbox
                    checked={keep[i]}
                    onCheckedChange={(v) => setKeep((k) => k.map((x, j) => (j === i ? v === true : x)))}
                    data-testid={`checkbox-ocr-${i}`}
                  />
                  <Select
                    value={r.club}
                    onValueChange={(v) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, club: v as ClubKey } : x)))}
                  >
                    <SelectTrigger className="h-8 w-40" data-testid={`select-ocr-club-${i}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL.map((c) => (
                        <SelectItem key={c} value={c}>{CLUB_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    {PREVIEW.filter((f) => r[f.key]).length} valeurs lues
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs sm:grid-cols-6">
                  {PREVIEW.map((f) => (
                    <div key={f.key}>
                      <div className="whitespace-nowrap text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</div>
                      <div className="font-mono">{(r[f.key] as string) || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} data-testid="button-ocr-cancel">
              Annuler
            </Button>
            <Button onClick={confirm} disabled={!nKeep} data-testid="button-ocr-confirm">
              Insérer {nKeep} club{nKeep > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
