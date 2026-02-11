import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";

interface ExportDeadlinesPDFOptions {
  deadlines: any[];
  filtersLabel: string;
  getClientName: (deadline: any) => string;
}

export function exportDeadlinesPDF({ deadlines, filtersLabel, getClientName }: ExportDeadlinesPDFOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relação de Prazos", 15, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 15, 25);
  doc.text(`Filtros: ${filtersLabel}`, 15, 30);
  doc.text(`Total: ${deadlines.length} prazo(s)`, 15, 35);

  // Summary counts
  const now = new Date();
  const overdueCount = deadlines.filter(d => d.status === "open" && parseLocalDateTime(d.fatal_due_at) < now).length;
  const todayCount = deadlines.filter(d => {
    const fatal = parseLocalDateTime(d.fatal_due_at);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return fatal >= start && fatal <= end;
  }).length;

  if (overdueCount > 0 || todayCount > 0) {
    const parts: string[] = [];
    if (overdueCount > 0) parts.push(`${overdueCount} atrasado(s)`);
    if (todayCount > 0) parts.push(`${todayCount} vence(m) hoje`);
    doc.setTextColor(200, 0, 0);
    doc.text(`⚠ ${parts.join(" | ")}`, 15, 40);
    doc.setTextColor(0);
  }

  const startY = overdueCount > 0 || todayCount > 0 ? 45 : 40;

  // Status labels
  const statusLabels: Record<string, string> = {
    open: "Aberto",
    completed: "Concluído",
    reviewed: "Conferido",
    adjustment_requested: "Ajuste",
  };

  const priorityLabels = (p: number) => p === 2 ? "Crítica" : p === 1 ? "Alta" : "Normal";

  // Table data
  const tableData = deadlines.map((d) => {
    const fatalStr = format(parseLocalDateTime(d.fatal_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
    const deliveryStr = format(parseLocalDateTime(d.delivery_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
    const notes = d.notes ? (d.notes.length > 120 ? d.notes.substring(0, 117) + "..." : d.notes) : "—";
    const driveText = d.drive_link ? "Sim" : "—";

    return [
      fatalStr,
      deliveryStr,
      d.title,
      d.team_members?.name || "—",
      d.cases?.title || "—",
      d.cases?.cnj_number || "—",
      getClientName(d),
      notes,
      driveText,
    ];
  });

  autoTable(doc, {
    head: [[
      "Prazo Fatal",
      "Entrega",
      "Título",
      "Responsável",
      "Processo",
      "CNJ",
      "Cliente",
      "Observações",
      "Drive",
    ]],
    body: tableData,
    startY,
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 22, halign: "center" }, // Fatal
      1: { cellWidth: 22, halign: "center" }, // Entrega
      2: { cellWidth: 30 }, // Título
      3: { cellWidth: 20 }, // Responsável
      4: { cellWidth: 25 }, // Processo
      5: { cellWidth: 22 }, // CNJ
      6: { cellWidth: 20 }, // Cliente
      7: { cellWidth: "auto" }, // Observações
      8: { cellWidth: 10, halign: "center" }, // Drive
    },
    didDrawPage: (data: any) => {
      // Footer with page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    },
  });

  doc.save(`prazos_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
