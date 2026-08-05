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

function formatCell<T extends object>(column: ReportColumn<T>, row: T): string {
  const value = row[column.key];
  return column.format ? column.format(value, row) : String(value ?? "");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
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

export function exportReportToExcel<T extends object>(definition: ReportDefinition<T>): void {
  const generatedAt = definition.generatedAt ?? new Date();
  const headers = definition.columns
    .map((column) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`)
    .join("");
  const rows = definition.rows
    .map((row) => `<Row>${definition.columns
      .map((column) => `<Cell ss:StyleID="Body"><Data ss:Type="String">${escapeXml(formatCell(column, row))}</Data></Cell>`)
      .join("")}</Row>`)
    .join("");
  const metadataRows = [
    ["رقم التقرير", definition.reportNo],
    ["العنوان", definition.title],
    ["المشروع", definition.projectName ?? "-"],
    ["تاريخ الإصدار", generatedAt.toLocaleString("ar-SA")],
    ["حالة الاعتماد", definition.approvalStatus ?? "مسودة"],
  ]
    .map(([label, value]) => `<Row><Cell ss:StyleID="MetaLabel"><Data ss:Type="String">${escapeXml(label)}</Data></Cell><Cell ss:StyleID="Meta"><Data ss:Type="String">${escapeXml(value)}</Data></Cell></Row>`)
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/><Font ss:FontName="Arial" ss:Size="11"/></Style>
  <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#C9A227"/><Interior ss:Color="#071B34" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B315B" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Body"><Alignment ss:ReadingOrder="RightToLeft"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D7DEE8"/></Borders></Style>
  <Style ss:ID="MetaLabel"><Font ss:Bold="1" ss:Color="#071B34"/><Interior ss:Color="#E9EDF3" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Meta"><Alignment ss:ReadingOrder="RightToLeft"/></Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(definition.reportNo)}"><Table>
  <Row ss:Height="30"><Cell ss:StyleID="Title" ss:MergeAcross="${Math.max(definition.columns.length - 1, 0)}"><Data ss:Type="String">ACP Enterprise — ${escapeXml(definition.title)}</Data></Cell></Row>
  ${metadataRows}<Row>${headers}</Row>${rows}
 </Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/></WorksheetOptions></Worksheet>
</Workbook>`;

  downloadBlob(new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" }), `${definition.reportNo}.xls`);
}

function printableHtml<T extends object>(definition: ReportDefinition<T>): string {
  const generatedAt = definition.generatedAt ?? new Date();
  const verificationPayload = buildVerificationPayload(definition.reportNo, definition.verificationPath);
  const qrImageUrl = buildQrImageUrl(verificationPayload);
  const headerCells = definition.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const bodyRows = definition.rows.length > 0
    ? definition.rows.map((row, index) => `<tr><td class="index">${index + 1}</td>${definition.columns.map((column) => `<td>${escapeHtml(formatCell(column, row))}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${definition.columns.length + 1}" class="empty">لا توجد سجلات ضمن هذا التقرير.</td></tr>`;

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(definition.reportNo)} — ${escapeHtml(definition.title)}</title>
<style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Tahoma,Arial,sans-serif;color:#10243e;background:#eef3f8;direction:rtl}.toolbar{position:sticky;top:0;z-index:3;padding:12px;text-align:center;background:#eef3f8}.toolbar button{background:#071b34;color:#fff;border:0;border-radius:9px;padding:11px 22px;font-weight:700;font-size:14px}.report{width:min(100%,210mm);margin:0 auto 24px;background:#fff;border:1px solid #d4dbe5;min-height:270mm;position:relative;padding-bottom:22mm;box-shadow:0 18px 45px rgba(7,27,52,.10)}.header{background:#071b34;color:#fff;padding:20px 22px;border-bottom:5px solid #c9a227}.brand{display:flex;align-items:center;justify-content:space-between;gap:16px}.brand-lockup{display:flex;align-items:center;gap:10px}.brand-lockup img{width:48px;height:48px}.brand strong{color:#e7ca70;font-size:20px;letter-spacing:.5px}.brand span{font-size:11px;opacity:.82}h1{margin:16px 0 4px;font-size:24px}.subtitle{margin:0;color:#d9e3ef;font-size:13px}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 20px;background:#f3f6fa;border-bottom:1px solid #d4dbe5}.meta div{background:#fff;border:1px solid #dce2ea;padding:9px;border-radius:7px}.meta b{color:#826817;display:block;font-size:11px;margin-bottom:4px}.content{padding:18px 20px;overflow:auto}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#0b315b;color:#fff;padding:8px;border:1px solid #274c73}td{padding:7px;border:1px solid #d8dee7;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.index{width:34px;text-align:center;font-weight:bold;color:#826817}.empty{text-align:center;padding:28px;color:#617087}.approval{margin-top:16px;border:1px solid #c9a227;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:16px}.verification{display:flex;align-items:center;gap:10px;max-width:65%;overflow-wrap:anywhere;font-size:9px}.verification img{width:78px;height:78px;object-fit:contain}.footer{position:absolute;right:20px;left:20px;bottom:10px;border-top:1px solid #d8dee7;padding-top:8px;display:flex;justify-content:space-between;color:#5d6b7d;font-size:9px}@media(max-width:700px){body{background:#fff}.report{border:0;box-shadow:none;margin:0;min-height:100vh}.meta{grid-template-columns:1fr 1fr}.content{padding:12px}.approval{align-items:flex-start;flex-direction:column}.verification{max-width:100%}}@media print{body{background:#fff}.toolbar{display:none}.report{border:0;box-shadow:none;margin:0;width:100%}}
</style></head><body>
<div class="toolbar"><button type="button" onclick="window.print()">طباعة / حفظ PDF</button></div>
<section class="report"><header class="header"><div class="brand"><div class="brand-lockup"><img src="/acp-mark.svg" alt="ACP"/><div><strong>ACP ENTERPRISE</strong><br/><span>إدارة المشاريع والتشغيل والأصول</span></div></div><span>وثيقة تشغيلية موثقة</span></div><h1>${escapeHtml(definition.title)}</h1><p class="subtitle">${escapeHtml(definition.subtitle ?? "تقرير رسمي")}</p></header>
<div class="meta"><div><b>رقم التقرير</b>${escapeHtml(definition.reportNo)}</div><div><b>المشروع</b>${escapeHtml(definition.projectName ?? "-")}</div><div><b>تاريخ الإصدار</b>${escapeHtml(generatedAt.toLocaleString("ar-SA"))}</div><div><b>إعداد</b>${escapeHtml(definition.generatedBy ?? "نظام ACP")}</div><div><b>حالة الاعتماد</b>${escapeHtml(definition.approvalStatus ?? "مسودة")}</div><div><b>عدد السجلات</b>${definition.rows.length}</div></div>
<main class="content"><table><thead><tr><th>م</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="approval"><div><strong>الاعتماد:</strong> ${escapeHtml(definition.approvalStatus ?? "بانتظار الاعتماد")}</div><div class="verification">${qrImageUrl ? `<img src="${escapeHtml(qrImageUrl)}" alt="رمز التحقق" />` : ""}<span>${escapeHtml(verificationPayload)}</span></div></div></main>
<footer class="footer"><span>وثيقة صادرة من ACP Enterprise</span><span>${escapeHtml(definition.reportNo)}</span></footer></section></body></html>`;
}

export function openPrintableReport<T extends object>(definition: ReportDefinition<T>): void {
  const html = printableHtml(definition);

  // Safari returns null when noopener is passed as a window feature even when the
  // user initiated the action. Open synchronously first, then sever the opener.
  const reportWindow = window.open("about:blank", "_blank");
  if (reportWindow) {
    try {
      reportWindow.opener = null;
      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      reportWindow.focus();
      return;
    } catch {
      reportWindow.close();
    }
  }

  // Mobile/PWA fallback: open a generated HTML document through a direct anchor.
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
