import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";

interface ExportDeadlinesPDFOptions {
  deadlines: any[];
  filtersLabel: string;
}

export function exportDeadlinesPDF({ deadlines, filtersLabel }: ExportDeadlinesPDFOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Prazos", 15, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 15, 25);
  doc.text(`Filtros: ${filtersLabel}`, 15, 30);
  doc.text(`Total: ${deadlines.length} prazo(s)`, 15, 35);
  doc.setTextColor(0);

  const startY = 40;

  // Table data — only 6 columns
  const tableData = deadlines.map((d) => {
    const fatalStr = format(parseLocalDateTime(d.fatal_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
    const deliveryStr = format(parseLocalDateTime(d.delivery_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
    const title = d.title && d.title.length > 60 ? d.title.substring(0, 57) + "..." : (d.title || "—");

    return [
      fatalStr,
      deliveryStr,
      title,
      d.team_members?.name || "—",
      d.cases?.title || "—",
      d.cases?.cnj_number || "—",
    ];
  });

  const usable = pageWidth - 30; // 15mm margins each side

  autoTable(doc, {
    head: [[
      "Prazo Fatal",
      "Entrega",
      "Título",
      "Responsável",
      "Processo",
      "CNJ",
    ]],
    body: tableData,
    startY,
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: "linebreak",
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: usable * 0.16, halign: "center" },
      1: { cellWidth: usable * 0.16, halign: "center" },
      2: { cellWidth: usable * 0.22 },
      3: { cellWidth: usable * 0.14 },
      4: { cellWidth: usable * 0.20 },
      5: { cellWidth: usable * 0.12, halign: "center", fontSize: 7 },
    },
    didDrawPage: (data: any) => {
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
