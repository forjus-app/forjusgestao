import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  title: string;
  cnj_number: string | null;
  original_number: string | null;
  internal_number: string | null;
  tribunal: string | null;
  court: string | null;
  city: string | null;
  state: string | null;
  claim_value: number | null;
  _row: number;
  _status: "ok" | "duplicate_file" | "duplicate_db" | "invalid";
  _reason?: string;
}

const TEMPLATE_HEADERS = [
  "titulo",
  "cnj",
  "numero_original",
  "numero_interno",
  "tribunal",
  "vara",
  "cidade",
  "uf",
  "valor_causa",
];

const normalizeCnj = (v: any) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\D/g, "");
  return s || null;
};

const pick = (row: any, keys: string[]) => {
  for (const k of keys) {
    const found = Object.keys(row).find(
      (rk) => rk.toLowerCase().trim().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== "") {
      return row[found];
    }
  }
  return null;
};

export function BulkImportCasesDialog({ open, onOpenChange }: Props) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");

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
        "Ação Trabalhista - Cliente Exemplo",
        "0000000-00.0000.0.00.0000",
        "12345/2024",
        "INT-001",
        "TJSP",
        "1ª Vara Cível",
        "São Paulo",
        "SP",
        "10000.00",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Processos");
    XLSX.writeFile(wb, "modelo_importacao_processos.xlsx");
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
        setParsing(false);
        return;
      }

      // Get existing CNJs from DB
      const { data: existing } = await supabase
        .from("cases")
        .select("cnj_number")
        .eq("organization_id", organization.id)
        .not("cnj_number", "is", null);
      const existingSet = new Set((existing || []).map((c) => normalizeCnj(c.cnj_number)).filter(Boolean));

      const seenInFile = new Set<string>();
      const parsed: ParsedRow[] = json.map((r, idx) => {
        const title = String(pick(r, ["titulo", "title", "nome", "processo"]) || "").trim();
        const cnjRaw = pick(r, ["cnj", "numero_cnj", "cnj_number", "numerocnj"]);
        const cnj = cnjRaw ? String(cnjRaw).trim() : null;
        const cnjNorm = normalizeCnj(cnj);
        const valorRaw = pick(r, ["valor_causa", "valorcausa", "claim_value", "valor"]);
        let valor: number | null = null;
        if (valorRaw !== null && valorRaw !== "") {
          const n = parseFloat(String(valorRaw).replace(/\./g, "").replace(",", "."));
          if (!isNaN(n)) valor = n;
        }
        const row: ParsedRow = {
          title,
          cnj_number: cnj,
          original_number: pick(r, ["numero_original", "originalnumber", "numerooriginal"]) as string | null,
          internal_number: pick(r, ["numero_interno", "internalnumber", "numerointerno"]) as string | null,
          tribunal: pick(r, ["tribunal", "court"]) as string | null,
          court: pick(r, ["vara", "court_division", "courtdivision"]) as string | null,
          city: pick(r, ["cidade", "city"]) as string | null,
          state: pick(r, ["uf", "estado", "state"]) as string | null,
          claim_value: valor,
          _row: idx + 2,
          _status: "ok",
        };
        if (!title) {
          row._status = "invalid";
          row._reason = "Título vazio";
        } else if (cnjNorm && existingSet.has(cnjNorm)) {
          row._status = "duplicate_db";
          row._reason = "CNJ já cadastrado";
        } else if (cnjNorm && seenInFile.has(cnjNorm)) {
          row._status = "duplicate_file";
          row._reason = "CNJ repetido na planilha";
        } else if (cnjNorm) {
          seenInFile.add(cnjNorm);
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

  const handleImport = async () => {
    if (!organization || okRows.length === 0) return;
    setImporting(true);
    try {
      const payload = okRows.map((r) => ({
        organization_id: organization.id,
        title: r.title,
        cnj_number: r.cnj_number || null,
        original_number: r.original_number,
        internal_number: r.internal_number,
        tribunal: r.tribunal,
        court: r.court,
        city: r.city,
        state: r.state ? String(r.state).toUpperCase().slice(0, 2) : null,
        claim_value: r.claim_value,
      }));

      // Insert in chunks of 200
      const chunks: typeof payload[] = [];
      for (let i = 0; i < payload.length; i += 200) chunks.push(payload.slice(i, i + 200));

      let inserted = 0;
      let failed = 0;
      for (const chunk of chunks) {
        const { data, error } = await supabase.from("cases").insert(chunk).select("id");
        if (error) {
          failed += chunk.length;
          console.error(error);
        } else {
          inserted += data?.length || 0;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["cases"] });
      if (failed > 0) {
        toast.warning(`${inserted} importados, ${failed} falharam`);
      } else {
        toast.success(`${inserted} processo(s) importado(s) com sucesso!`);
      }
      handleClose(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  const statusBadge = (s: ParsedRow["_status"]) => {
    if (s === "ok") return <Badge className="bg-success text-success-foreground">Pronto</Badge>;
    if (s === "duplicate_db") return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Duplicado (BD)</Badge>;
    if (s === "duplicate_file") return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Duplicado (arquivo)</Badge>;
    return <Badge variant="destructive">Inválido</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Processos em Massa
          </DialogTitle>
          <DialogDescription>
            Envie uma planilha (.xlsx ou .csv). Processos com CNJ duplicado são removidos automaticamente.
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
              disabled={parsing || importing}
            />
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
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
                  <span>{okRows.length} prontos para importar</span>
                </div>
                {skipped > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>{skipped} ignorados (duplicados/inválidos)</span>
                  </div>
                )}
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  Colunas reconhecidas: <strong>titulo</strong> (obrigatório), cnj, numero_original, numero_interno, tribunal, vara, cidade, uf, valor_causa.
                </AlertDescription>
              </Alert>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>CNJ</TableHead>
                      <TableHead>Trib.</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r._row} className={r._status !== "ok" ? "opacity-60" : ""}>
                        <TableCell className="text-xs">{r._row}</TableCell>
                        <TableCell className="text-sm">{r.title || <em className="text-muted-foreground">—</em>}</TableCell>
                        <TableCell className="text-xs font-mono">{r.cnj_number || "—"}</TableCell>
                        <TableCell className="text-xs">{r.tribunal || "—"}</TableCell>
                        <TableCell className="text-xs">{r.state || "—"}</TableCell>
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
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={importing || okRows.length === 0}>
            {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Upload className="h-4 w-4 mr-2" />
            Importar {okRows.length > 0 ? `(${okRows.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
