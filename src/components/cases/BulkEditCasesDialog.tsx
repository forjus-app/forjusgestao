import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";

const ACCESS_PASSWORD = "Forjus@";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UpdateRow {
  id: string;
  changes: Record<string, any>;
  title: string;
  _row: number;
  _status: "ok" | "unchanged" | "invalid";
  _reason?: string;
  _changedLabels: string[];
}

const HEADERS = [
  "id",
  "titulo",
  "cnj",
  "numero_original",
  "numero_interno",
  "tribunal",
  "vara",
  "cidade",
  "uf",
  "valor_causa",
  "responsavel",
  "status",
  "area",
  "link_url",
  "drive_link",
];

const norm = (k: string) => k.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

const pick = (row: any, key: string) => {
  const found = Object.keys(row).find((rk) => norm(rk) === norm(key));
  if (!found) return undefined;
  const v = row[found];
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const parseMoney = (v: string | null) => {
  if (v === null) return null;
  const n = parseFloat(String(v).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? null : n;
};

const same = (a: any, b: any) => {
  const na = a === undefined || a === null || a === "" ? null : a;
  const nb = b === undefined || b === null || b === "" ? null : b;
  if (typeof na === "number" || typeof nb === "number") return Number(na) === Number(nb);
  return String(na) === String(nb);
};

export function BulkEditCasesDialog({ open, onOpenChange }: Props) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [exporting, setExporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setRows([]);
    setFileName("");
    setPassword("");
    setUnlocked(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const tryUnlock = () => {
    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
    } else {
      toast.error("Senha incorreta");
    }
  };

  const fetchCases = async () => {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `id, title, cnj_number, original_number, internal_number, tribunal, court, city, state, claim_value, link_url, drive_link,
         status_id, area_id, default_deadline_responsible_id,
         case_statuses (name), case_areas (name), team_members:default_deadline_responsible_id (name)`
      )
      .eq("organization_id", organization!.id)
      .order("title");
    if (error) throw error;
    return data || [];
  };

  const handleExport = async () => {
    if (!organization) return;
    setExporting(true);
    try {
      const data = await fetchCases();
      const aoa = [
        HEADERS,
        ...data.map((c: any) => [
          c.id,
          c.title || "",
          c.cnj_number || "",
          c.original_number || "",
          c.internal_number || "",
          c.tribunal || "",
          c.court || "",
          c.city || "",
          c.state || "",
          c.claim_value ?? "",
          c.team_members?.name || "",
          c.case_statuses?.name || "",
          c.case_areas?.name || "",
          c.link_url || "",
          c.drive_link || "",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Processos");
      XLSX.writeFile(wb, `processos_edicao_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${data.length} processo(s) exportado(s)`);
    } catch (e: any) {
      toast.error("Erro ao exportar: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (file: File) => {
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
        return;
      }

      const [cases, members, statuses, areas] = await Promise.all([
        fetchCases(),
        supabase.from("team_members").select("id, name").eq("organization_id", organization.id),
        supabase.from("case_statuses").select("id, name").eq("organization_id", organization.id),
        supabase.from("case_areas").select("id, name").eq("organization_id", organization.id),
      ]);

      const byId = new Map(cases.map((c: any) => [c.id, c]));
      const memberByName = new Map((members.data || []).map((m) => [norm(m.name), m.id]));
      const statusByName = new Map((statuses.data || []).map((s) => [norm(s.name), s.id]));
      const areaByName = new Map((areas.data || []).map((a) => [norm(a.name), a.id]));

      const parsed: UpdateRow[] = json.map((r, idx) => {
        const id = pick(r, "id");
        const base: UpdateRow = {
          id: id || "",
          changes: {},
          title: pick(r, "titulo") || "",
          _row: idx + 2,
          _status: "ok",
          _changedLabels: [],
        };
        if (!id || !byId.has(id)) {
          base._status = "invalid";
          base._reason = id ? "ID não encontrado" : "ID vazio";
          return base;
        }
        const current: any = byId.get(id);
        const changes: Record<string, any> = {};
        const labels: string[] = [];

        const set = (col: string, label: string, value: any, currentValue: any) => {
          if (value === undefined) return;
          if (!same(value, currentValue)) {
            changes[col] = value;
            labels.push(label);
          }
        };

        const title = pick(r, "titulo");
        if (title !== undefined) {
          if (title === null) {
            base._status = "invalid";
            base._reason = "Título não pode ficar vazio";
            return base;
          }
          set("title", "título", title, current.title);
        }
        set("cnj_number", "CNJ", pick(r, "cnj"), current.cnj_number);
        set("original_number", "nº original", pick(r, "numero_original"), current.original_number);
        set("internal_number", "nº interno", pick(r, "numero_interno"), current.internal_number);
        set("tribunal", "tribunal", pick(r, "tribunal"), current.tribunal);
        set("court", "vara", pick(r, "vara"), current.court);
        set("city", "cidade", pick(r, "cidade"), current.city);
        const uf = pick(r, "uf");
        set("state", "UF", uf === null ? null : uf === undefined ? undefined : uf.toUpperCase().slice(0, 2), current.state);
        const valor = pick(r, "valor_causa");
        set("claim_value", "valor da causa", valor === undefined ? undefined : parseMoney(valor), current.claim_value);
        set("link_url", "link", pick(r, "link_url"), current.link_url);
        set("drive_link", "Drive", pick(r, "drive_link"), current.drive_link);

        const resolveRef = (
          value: string | null | undefined,
          map: Map<string, string>,
          col: string,
          label: string,
          currentId: string | null
        ) => {
          if (value === undefined) return true;
          if (value === null) {
            set(col, label, null, currentId);
            return true;
          }
          const found = map.get(norm(value));
          if (!found) {
            base._status = "invalid";
            base._reason = `${label} "${value}" não cadastrado`;
            return false;
          }
          set(col, label, found, currentId);
          return true;
        };

        if (!resolveRef(pick(r, "responsavel"), memberByName, "default_deadline_responsible_id", "responsável", current.default_deadline_responsible_id)) return base;
        if (!resolveRef(pick(r, "status"), statusByName, "status_id", "status", current.status_id)) return base;
        if (!resolveRef(pick(r, "area"), areaByName, "area_id", "área", current.area_id)) return base;

        base.title = current.title;
        base.changes = changes;
        base._changedLabels = labels;
        if (labels.length === 0) {
          base._status = "unchanged";
          base._reason = "Sem alterações";
        }
        return base;
      });

      setRows(parsed);
    } catch (e: any) {
      toast.error("Erro ao ler planilha: " + e.message);
    } finally {
      setParsing(false);
    }
  };

  const okRows = rows.filter((r) => r._status === "ok");
  const invalidCount = rows.filter((r) => r._status === "invalid").length;
  const unchangedCount = rows.filter((r) => r._status === "unchanged").length;

  const handleSave = async () => {
    if (!organization || okRows.length === 0) return;
    setSaving(true);
    let updated = 0;
    let failed = 0;
    try {
      for (const r of okRows) {
        const { error } = await supabase
          .from("cases")
          .update(r.changes)
          .eq("id", r.id)
          .eq("organization_id", organization.id);
        if (error) {
          failed++;
          console.error(error);
        } else {
          updated++;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      if (failed > 0) toast.warning(`${updated} atualizados, ${failed} falharam`);
      else toast.success(`${updated} processo(s) atualizado(s)!`);
      handleClose(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Edição em Massa por Planilha
          </DialogTitle>
          <DialogDescription>
            Exporte a planilha dos processos, edite e reenvie. Os prazos vinculados não são alterados.
          </DialogDescription>
        </DialogHeader>

        {!unlocked ? (
          <div className="space-y-4 py-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>Área protegida. Informe a senha para continuar.</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="bulk-edit-password">Senha</Label>
              <Input
                id="bulk-edit-password"
                type="password"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                placeholder="Digite a senha"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={tryUnlock} disabled={!password}>
                Acessar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Exportar Planilha
                </Button>
                <Input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="max-w-xs"
                  disabled={parsing || saving}
                />
                {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  Não altere nem remova a coluna <strong>id</strong> — é ela que identifica cada processo. Colunas
                  editáveis: titulo, cnj, numero_original, numero_interno, tribunal, vara, cidade, uf, valor_causa,
                  responsavel, status, area, link_url, drive_link. Responsável, status e área devem usar nomes já
                  cadastrados no sistema.
                </AlertDescription>
              </Alert>

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
                      <span>{okRows.length} com alterações</span>
                    </div>
                    {unchangedCount > 0 && <span className="text-muted-foreground">{unchangedCount} sem alterações</span>}
                    {invalidCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span>{invalidCount} com erro</span>
                      </div>
                    )}
                  </div>

                  <ScrollArea className="flex-1 border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Processo</TableHead>
                          <TableHead>Alterações</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={`${r._row}-${r.id}`} className={r._status !== "ok" ? "opacity-60" : ""}>
                            <TableCell className="text-xs">{r._row}</TableCell>
                            <TableCell className="text-sm">{r.title || <em className="text-muted-foreground">—</em>}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r._changedLabels.join(", ") || "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {r._status === "ok" ? (
                                  <Badge className="bg-success text-success-foreground">Atualizar</Badge>
                                ) : r._status === "unchanged" ? (
                                  <Badge variant="outline">Sem mudança</Badge>
                                ) : (
                                  <Badge variant="destructive">Erro</Badge>
                                )}
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
              <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || okRows.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Aplicar {okRows.length > 0 ? `(${okRows.length})` : ""}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
