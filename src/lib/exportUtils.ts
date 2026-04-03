import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => string);
}

interface ExportOptions {
  title: string;
  columns: ExportColumn[];
  data: any[];
  filename: string;
}

const getValue = (row: any, accessor: string | ((row: any) => string)): string => {
  if (typeof accessor === "function") {
    return accessor(row);
  }
  const keys = accessor.split(".");
  let value = row;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined || value === null) return "-";
  }
  return String(value);
};

export function exportToPDF({ title, columns, data, filename }: ExportOptions) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    28
  );
  
  // Table
  const tableData = data.map((row) =>
    columns.map((col) => getValue(row, col.accessor))
  );
  
  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: 35,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  doc.save(`${filename}.pdf`);
}

export function exportToExcel({ title, columns, data, filename }: ExportOptions) {
  // Prepare data
  const worksheetData = data.map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col) => {
      obj[col.header] = getValue(row, col.accessor);
    });
    return obj;
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = columns.map((col) => ({ wch: Math.max(col.header.length, 15) }));
  worksheet["!cols"] = colWidths;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));
  
  // Export
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Cases export configuration
export const casesExportColumns: ExportColumn[] = [
  { header: "Título", accessor: "title" },
  { header: "Número CNJ", accessor: (row) => row.cnj_number || "-" },
  {
    header: "Cliente",
    accessor: (row) => {
      const primary = row.case_parties?.find((p: any) => p.is_primary_client);
      return primary?.contacts?.name || "-";
    },
  },
  { header: "Status", accessor: (row) => row.case_statuses?.name || "-" },
  { header: "Área", accessor: (row) => row.case_areas?.name || "-" },
  { header: "Fase", accessor: (row) => row.case_phases?.name || "-" },
  { header: "Tribunal", accessor: (row) => row.tribunal || "-" },
  { header: "Comarca", accessor: (row) => row.city || "-" },
  {
    header: "Data Abertura",
    accessor: (row) =>
      row.opened_at ? format(new Date(row.opened_at), "dd/MM/yyyy") : "-",
  },
  {
    header: "Atualizado",
    accessor: (row) =>
      format(new Date(row.updated_at), "dd/MM/yyyy", { locale: ptBR }),
  },
];

// Deadlines export configuration
export const deadlinesExportColumns: ExportColumn[] = [
  { header: "Título", accessor: "title" },
  { header: "Tipo", accessor: (row) => (row.type === "processual" ? "Processual" : "Interno") },
  { header: "Responsável", accessor: (row) => row.team_members?.name || "-" },
  { header: "Processo", accessor: (row) => row.cases?.title || "-" },
  { header: "Número CNJ", accessor: (row) => row.cases?.cnj_number || "-" },
  {
    header: "Data Entrega",
    accessor: (row) =>
      format(new Date(row.delivery_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  },
  {
    header: "Data Fatal",
    accessor: (row) =>
      format(new Date(row.fatal_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  },
  {
    header: "Status",
    accessor: (row) => {
      const labels: Record<string, string> = {
        open: "Aberto",
        in_progress: "Em Execução",
        completed: "Concluído",
      };
      return labels[row.status] || row.status;
    },
  },
  {
    header: "Prioridade",
    accessor: (row) => {
      if (row.priority === 2) return "Crítica";
      if (row.priority === 1) return "Alta";
      return "Normal";
    },
  },
  { header: "Observações", accessor: (row) => row.notes || "-" },
];
