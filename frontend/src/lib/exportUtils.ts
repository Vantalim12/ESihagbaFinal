import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// ─── CSV Export ──────────────────────────────────────────────

function escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function exportToCsv(
    filename: string,
    headers: string[],
    rows: string[][]
): void {
    const csvHeader = headers.map(escapeCsvValue).join(',');
    const csvRows = rows.map(row => row.map(escapeCsvValue).join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${filename}.csv`);
}

// ─── PDF Export ──────────────────────────────────────────────

interface PdfOptions {
    title: string;
    subtitle?: string;
    canisterId?: string;
}

export function exportToPdf(
    filename: string,
    headers: string[],
    rows: string[][],
    options: PdfOptions
): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // ── Brand Header ──
    const ACCENT = '#2d8f8f';
    const PRIMARY = '#1a2f38';

    // Header bar
    doc.setFillColor(ACCENT);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');

    // Title
    doc.setTextColor('#ffffff');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, 14, 12);

    // Subtitle / date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dateStr = format(new Date(), 'MMMM d, yyyy h:mm a');
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.getWidth() - 14, 12, {
        align: 'right',
    });

    // Canister ID line
    let startY = 24;
    if (options.canisterId) {
        doc.setTextColor(PRIMARY);
        doc.setFontSize(8);
        doc.text(`Canister: ${options.canisterId}`, 14, startY);
        startY += 6;
    }

    if (options.subtitle) {
        doc.setTextColor('#666666');
        doc.setFontSize(8);
        doc.text(options.subtitle, 14, startY);
        startY += 6;
    }

    // ── Table ──
    autoTable(doc, {
        startY,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: {
            fillColor: ACCENT,
            textColor: '#ffffff',
            fontStyle: 'bold',
            fontSize: 8,
        },
        bodyStyles: {
            fontSize: 7.5,
            textColor: PRIMARY,
        },
        alternateRowStyles: {
            fillColor: '#f0f9f9',
        },
        styles: {
            cellPadding: 2,
            lineWidth: 0.1,
            lineColor: '#e0e0e0',
        },
        margin: { left: 14, right: 14 },
    });

    // ── Footer ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor('#999999');
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
        );
        doc.text(
            'eSihagBa — Blockchain-Verified Governance',
            14,
            doc.internal.pageSize.getHeight() - 8
        );
    }

    doc.save(`${filename}.pdf`);
}

// ─── JSON Export ──────────────────────────────────────────────

export function exportToJson(filename: string, data: unknown): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, `${filename}.json`);
}

// ─── Shared Download Helper ──────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
