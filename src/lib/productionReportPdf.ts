import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProductionRow {
  name: string;
  deadlines: number;
  peticoes: number;
  total: number;
}

export function exportProductionReportPDF({
  rows,
  periodLabel,
}: {
  rows: ProductionRow[];
  periodLabel: string;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Produção", 15, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Período: ${periodLabel}`, 15, 25);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    15,
    30
  );
  doc.setTextColor(0);

  const totals = rows.reduce(
    (acc, r) => ({
      deadlines: acc.deadlines + r.deadlines,
      peticoes: acc.peticoes + r.peticoes,
      total: acc.total + r.total,
    }),
    { deadlines: 0, peticoes: 0, total: 0 }
  );

  const usable = pageWidth - 30;

  autoTable(doc, {
    head: [["Responsável", "Prazos Cumpridos", "Petições Protocoladas", "Total"]],
    body: rows.map((r) => [r.name, String(r.deadlines), String(r.peticoes), String(r.total)]),
    foot: [["TOTAL", String(totals.deadlines), String(totals.peticoes), String(totals.total)]],
    startY: 36,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", halign: "center" },
    footStyles: { fillColor: [230, 234, 240], textColor: 20, fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: usable * 0.4 },
      1: { cellWidth: usable * 0.2, halign: "center" },
      2: { cellWidth: usable * 0.25, halign: "center" },
      3: { cellWidth: usable * 0.15, halign: "center" },
    },
    didDrawPage: (data: any) => {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    },
  });

  doc.save(`relatorio_producao_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
