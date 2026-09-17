import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  _row: number;
  _status: "ok" | "not_found" | "no_data" | "invalid";
  _reason?: string;
  caseId?: string;
  matchedBy?: string;
  currentTitle?: string;
  updates: Record<string, any>;
}

const TEMPLATE_HEADERS = [
  "cnj",
  "numero_interno",
  "titulo",
  "numero_original",
  "tribunal",
  "vara",
  "cidade",
  "uf",
  "valor_causa",
  "responsavel",
  "link_drive",
];

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  cnj_number: "CNJ",
  original_number: "Nº original",
  internal_number: "Nº interno",
  tribunal: "Tribunal",
  court: "Vara",
  city: "Cidade",
  state: "UF",
  claim_value: "Valor da causa",
  default_deadline_responsible_id: "Responsável",
  drive_link: "Link do Drive",
};

const normalizeCnj = (v: any) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\D/g, "");
  return s || null;
};

const normKey = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

const pick = (row: any, keys: string[]) => {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => normKey(rk) === normKey(k));
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== "") {
      return String(row[found]).trim();
    }
  }
  return null;
};

export function BulkUpdateCasesDialog({ open, onOpenChange }: Props) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(true);

  const reset = () => {
    setRows([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      [
        "0000000-00.0000.0.00.0000",
        "INT-001",
        "Ação Trabalhista - Cliente Exemplo",
        "12345/2024",
        "TJSP",
        "1ª Vara Cível",
        "São Paulo",
        "SP",
        "10000.00",
        "Matheus",
        "https://drive.google.com/...",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atualizacao");
    XLSX.writeFile(wb, "modelo_atualizacao_processos.xlsx");
  };

  const handleFile = async (file: File, emptyOnly = onlyEmpty) => {
    if (!organization) return;
    setParsing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

      if (json.length === 0) {
        toast.error("Planilha vazia");
        setParsing(false);
        return;
      }

      const { data: existing, error } = await supabase
        .from("cases")
        .select(
          "id, title, cnj_number, internal_number, original_number, tribunal, court, city, state, claim_value, drive_link, default_deadline_responsible_id"
        )
        .eq("organization_id", organization.id);
      if (error) throw error;

      const { data: members } = await supabase
        .from("team_members")
        .select("id, name")
        .eq("organization_id", organization.id);

      const byCnj = new Map<string, any>();
      const byInternal = new Map<string, any>();
      (existing || []).forEach((c) => {
        const cnj = normalizeCnj(c.cnj_number);
        if (cnj) byCnj.set(cnj, c);
        if (c.internal_number) byInternal.set(normKey(c.internal_number), c);
      });
      const membersByName = new Map<string, string>();
      (members || []).forEach((m) => membersByName.set(normKey(m.name), m.id));

      const parsed: ParsedRow[] = json.map((r, idx) => {
        const cnj = pick(r, ["cnj", "numero_cnj", "cnj_number", "numerocnj"]);
        const internal = pick(r, ["numero_interno", "internalnumber", "numerointerno"]);
        const row: ParsedRow = { _row: idx + 2, _status: "ok", updates: {} };

        if (!cnj && !internal) {
          row._status = "invalid";
          row._reason = "Informe CNJ ou número interno";
          return row;
        }

        const cnjNorm = normalizeCnj(cnj);
        const match = (cnjNorm && byCnj.get(cnjNorm)) || (internal && byInternal.get(normKey(internal)));
        if (!match) {
          row._status = "not_found";
          row._reason = "Processo não encontrado";
          return row;
        }

        row.caseId = match.id;
        row.currentTitle = match.title;
        row.matchedBy = cnjNorm && byCnj.get(cnjNorm) ? "CNJ" : "Nº interno";

        const candidates: Record<string, any> = {
          title: pick(r, ["titulo", "title", "nome", "processo"]),
          cnj_number: cnj,
          original_number: pick(r, ["numero_original", "originalnumber", "numerooriginal"]),
          internal_number: internal,
          tribunal: pick(r, ["tribunal"]),
          court: pick(r, ["vara", "court", "court_division"]),
          city: pick(r, ["cidade", "city", "comarca"]),
          state: pick(r, ["uf", "estado", "state"]),
          drive_link: pick(r, ["link_drive", "drive", "drive_link", "linkdrive"]),
        };

        const valorRaw = pick(r, ["valor_causa", "valorcausa", "claim_value", "valor"]);
        if (valorRaw) {
          const n = parseFloat(valorRaw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
          if (!isNaN(n)) candidates.claim_value = n;
        }

        const respName = pick(r, ["responsavel", "responsável", "responsible", "advogado"]);
        if (respName) {
          const memberId = membersByName.get(normKey(respName));
          if (memberId) candidates.default_deadline_responsible_id = memberId;
          else row._reason = `Responsável "${respName}" não cadastrado`;
        }

        Object.entries(candidates).forEach(([field, value]) => {
          if (value === null || value === undefined || value === "") return;
          let v: any = value;
          if (field === "state") v = String(v).toUpperCase().slice(0, 2);
          const current = (match as any)[field];
          const currentEmpty = current === null || current === undefined || current === "";
          if (emptyOnly && !currentEmpty) return;
          if (String(current ?? "") === String(v)) return;
          row.updates[field] = v;
        });

        if (Object.keys(row.updates).length === 0) {
          row._status = "no_data";
          row._reason = row._reason || (emptyOnly ? "Nada faltando para preencher" : "Sem alterações");
        }
        return row;
      });

      setRows(parsed);
    } catch (e: any) {
      toast.error("Erro ao ler planilha: " + e.message);
    } finally {
      setParsing(false);
    }
  };

  const okRows = rows.filter((r) => r._status === "ok");
  const skipped = rows.length - okRows.length;

  const handleUpdate = async () => {
    if (!organization || okRows.length === 0) return;
    setUpdating(true);
    try {
      let updated = 0;
      let failed = 0;
      for (const r of okRows) {
        const { error } = await supabase
          .from("cases")
          .update(r.updates)
          .eq("id", r.caseId!)
          .eq("organization_id", organization.id);
        if (error) {
          failed++;
          console.error(error);
        } else updated++;
      }
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      if (failed > 0) toast.warning(`${updated} atualizados, ${failed} falharam`);
      else toast.success(`${updated} processo(s) atualizado(s) com sucesso!`);
      handleClose(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const statusBadge = (s: ParsedRow["_status"]) => {
    if (s === "ok") return <Badge className="bg-success text-success-foreground">Atualizar</Badge>;
    if (s === "not_found") return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Não encontrado</Badge>;
    if (s === "no_data") return <Badge variant="secondary">Sem mudanças</Badge>;
    return <Badge variant="destructive">Inválido</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Atualizar Processos por Planilha
          </DialogTitle>
          <DialogDescription>
            Cada linha é localizada pelo CNJ (ou número interno) e o cadastro é completado/corrigido com os dados da planilha.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </Button>
            <Input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="max-w-xs"
              disabled={parsing || updating}
            />
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          <div className="flex items-center gap-3 rounded-md border p-3">
            <Switch
              id="only-empty"
              checked={onlyEmpty}
              onCheckedChange={(v) => {
                setOnlyEmpty(v);
                const f = inputRef.current?.files?.[0];
                if (f) handleFile(f, v);
              }}
              disabled={parsing || updating}
            />
            <Label htmlFor="only-empty" className="text-sm font-normal">
              Preencher apenas campos vazios (desligue para também corrigir dados já preenchidos)
            </Label>
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando planilha...
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{okRows.length} processo(s) serão atualizados</span>
                </div>
                {skipped > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>{skipped} ignorados</span>
                  </div>
                )}
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  Colunas reconhecidas: <strong>cnj</strong> ou <strong>numero_interno</strong> (identificação), titulo,
                  numero_original, tribunal, vara, cidade, uf, valor_causa, responsavel, link_drive. Células vazias são ignoradas.
                </AlertDescription>
              </Alert>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>Localizado por</TableHead>
                      <TableHead>Campos a atualizar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r._row} className={r._status !== "ok" ? "opacity-60" : ""}>
                        <TableCell className="text-xs">{r._row}</TableCell>
                        <TableCell className="text-sm">{r.currentTitle || <em className="text-muted-foreground">—</em>}</TableCell>
                        <TableCell className="text-xs">{r.matchedBy || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {Object.keys(r.updates).length > 0
                            ? Object.keys(r.updates).map((f) => FIELD_LABELS[f] || f).join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {statusBadge(r._status)}
                            {r._reason && <span className="text-[10px] text-muted-foreground">{r._reason}</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={updating}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={updating || okRows.length === 0}>
            {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar {okRows.length > 0 ? `(${okRows.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
