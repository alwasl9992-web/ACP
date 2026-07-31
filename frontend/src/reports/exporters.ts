import { runtimeConfig } from "../config/runtime";

export interface ReportColumn<T extends object> {
  key: keyof T;
  label: string;
  width?: number;
  format?: (value: T[keyof T], row: T) => string;
}

export interface ReportDefinition<T extends object> {
  reportNo: string;
  title: string;
  subtitle?: string;
  projectName?: string;
  generatedBy?: string;
  generatedAt?: Date;
  columns: ReportColumn<T>[];
  rows: T[];
  approvalStatus?: string;
  verificationPath?: string;
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value: unknown): string {
  return escapeXml(value);
}

function formatCell<T extends object>(
  column: ReportColumn<T>,
  row: T,
): string {
  const value = row[column.key];
  return column.format ? column.format(value, row) : String(value ?? "");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildVerificationPayload(reportNo: string, path?: string): string {
  const targetPath = path ?? `/reports/verify/${encodeURIComponent(reportNo)}`;
  return `${runtimeConfig.appUrl}${targetPath}`;
}

export function buildQrImageUrl(payload: string): string | null {
  if (!runtimeConfig.configured) return null;
  const query = new URLSearchParams({ data: payload, format: "svg" });
  return `${runtimeConfig.supabaseUrl}/functions/v1/report-qr?${query.toString()}`;
}

export function exportReportToExcel<T extends object>(
  definition: ReportDefinition<T>,
): void {
  const generatedAt = definition.generatedAt ?? new Date();
  const headers = definition.columns
    .map(
      (column) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`,
    )
    .join("");

  const rows = definition.rows
    .map(
      (row) =>
        `<Row>${definition.columns
          .map(
            (column) =>
              `<Cell ss:StyleID="Body"><Data ss:Type="String">${escapeXml(
                formatCell(column, row),
              )}</Data></Cell>`,
          )
          .join("")}</Row>`,
    )
    .join("");

  const metadataRows = [
    ["رقم التقرير", definition.reportNo],
    ["العنوان", definition.title],
    ["المشروع", definition.projectName ?? "-"],
    ["تاريخ الإصدار", generatedAt.toLocaleString("ar-SA")],
    ["حالة الاعتماد", definition.approvalStatus ?? "مسودة"],
  ]
    .map(
      ([label, value]) =>
        `<Row><Cell ss:StyleID="MetaLabel"><Data ss:Type="String">${escapeXml(
          label,
        )}</Data></Cell><Cell ss:StyleID="Meta"><Data ss:Type="String">${escapeXml(
          value,
        )}</Data></Cell></Row>`,
    )
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/><Font ss:FontName="Arial" ss:Size="11"/></Style>
  <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#C9A227"/><Interior ss:Color="#071B34" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B315B" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="Body"><Alignment ss:ReadingOrder="RightToLeft"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D7DEE8"/></Borders></Style>
  <Style ss:ID="MetaLabel"><Font ss:Bold="1" ss:Color="#071B34"/><Interior ss:Color="#E9EDF3" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Meta"><Alignment ss:ReadingOrder="RightToLeft"/></Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(definition.reportNo)}">
  <Table>
   <Row ss:Height="30"><Cell ss:StyleID="Title" ss:MergeAcross="${Math.max(
     definition.columns.length - 1,
     0,
   )}"><Data ss:Type="String">ACP Enterprise — ${escapeXml(
     definition.title,
   )}</Data></Cell></Row>
   ${metadataRows}
   <Row>${headers}</Row>
   ${rows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/></WorksheetOptions>
 </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `${definition.reportNo}.xls`,
  );
}

export function openPrintableReport<T extends object>(
  definition: ReportDefinition<T>,
): void {
  const generatedAt = definition.generatedAt ?? new Date();
  const verificationPayload = buildVerificationPayload(
    definition.reportNo,
    definition.verificationPath,
  );
  const qrImageUrl = buildQrImageUrl(verificationPayload);
  const reportWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!reportWindow) {
    throw new Error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع.");
  }

  const headerCells = definition.columns
    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
    .join("");
  const bodyRows = definition.rows
    .map(
      (row, index) => `<tr><td class="index">${index + 1}</td>${definition.columns
        .map((column) => `<td>${escapeHtml(formatCell(column, row))}</td>`)
        .join("")}</tr>`,
    )
    .join("");

  reportWindow.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(definition.reportNo)} — ${escapeHtml(definition.title)}</title>
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Tahoma, sans-serif; color: #10243e; background: #fff; direction: rtl; }
.report { border: 1px solid #d4dbe5; min-height: 260mm; position: relative; padding-bottom: 22mm; }
.header { background: #071b34; color: #fff; padding: 18px 22px; border-bottom: 4px solid #c9a227; }
.brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.brand strong { color: #c9a227; font-size: 22px; letter-spacing: .5px; }
.brand span { font-size: 12px; opacity: .88; }
h1 { margin: 14px 0 4px; font-size: 24px; }
.subtitle { margin: 0; color: #d9e3ef; font-size: 13px; }
.meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 14px 20px; background: #f3f6fa; border-bottom: 1px solid #d4dbe5; }
.meta div { background: #fff; border: 1px solid #dce2ea; padding: 8px; border-radius: 5px; }
.meta b { color: #826817; display: block; font-size: 11px; margin-bottom: 4px; }
.content { padding: 18px 20px; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th { background: #0b315b; color: #fff; padding: 8px; border: 1px solid #274c73; }
td { padding: 7px; border: 1px solid #d8dee7; vertical-align: top; }
tr:nth-child(even) td { background: #f8fafc; }
.index { width: 34px; text-align: center; font-weight: bold; color: #826817; }
.approval { margin-top: 16px; border: 1px solid #c9a227; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
.verification { display: flex; align-items: center; gap: 10px; max-width: 60%; overflow-wrap: anywhere; font-size: 9px; }
.verification img { width: 78px; height: 78px; object-fit: contain; }
.footer { position: absolute; right: 20px; left: 20px; bottom: 10px; border-top: 1px solid #d8dee7; padding-top: 8px; display: flex; justify-content: space-between; color: #5d6b7d; font-size: 9px; }
.no-print { text-align: center; padding: 12px; }
button { background: #071b34; color: white; border: 0; border-radius: 6px; padding: 10px 18px; cursor: pointer; }
@media print { .no-print { display: none; } .report { border: 0; } }
</style>
</head>
<body>
<div class="no-print"><button onclick="window.print()">طباعة / حفظ PDF</button></div>
<section class="report">
<header class="header">
  <div class="brand"><strong>ACP ENTERPRISE</strong><span>منصة إدارة المشاريع والتشغيل والأصول</span></div>
  <h1>${escapeHtml(definition.title)}</h1>
  <p class="subtitle">${escapeHtml(definition.subtitle ?? "تقرير رسمي معتمد")}</p>
</header>
<div class="meta">
  <div><b>رقم التقرير</b>${escapeHtml(definition.reportNo)}</div>
  <div><b>المشروع</b>${escapeHtml(definition.projectName ?? "-")}</div>
  <div><b>تاريخ الإصدار</b>${escapeHtml(generatedAt.toLocaleString("ar-SA"))}</div>
  <div><b>إعداد</b>${escapeHtml(definition.generatedBy ?? "نظام ACP")}</div>
  <div><b>حالة الاعتماد</b>${escapeHtml(definition.approvalStatus ?? "مسودة")}</div>
  <div><b>عدد السجلات</b>${definition.rows.length}</div>
</div>
<main class="content">
<table><thead><tr><th>م</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
<div class="approval">
  <div><strong>الاعتماد:</strong> ${escapeHtml(definition.approvalStatus ?? "بانتظار الاعتماد")}</div>
  <div class="verification">
    ${qrImageUrl ? `<img src="${escapeHtml(qrImageUrl)}" alt="QR" />` : ""}
    <span>${escapeHtml(verificationPayload)}</span>
  </div>
</div>
</main>
<footer class="footer"><span>وثيقة صادرة من ACP Enterprise</span><span>${escapeHtml(definition.reportNo)}</span></footer>
</section>
</body>
</html>`);
  reportWindow.document.close();
}
