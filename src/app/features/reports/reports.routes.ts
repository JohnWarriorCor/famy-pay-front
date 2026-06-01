import { Routes } from '@angular/router';
import { Component, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Chart, registerables } from 'chart.js';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DatePickerModule, SelectModule, CardModule, TagModule, CurrencyFormatPipe
  ],
  template: `
    <div class="reports-page animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Reportes 📊</h1>
        <p class="page-subtitle">Análisis financiero y exportación</p>
      </div>

      <!-- Export Actions -->
      <div class="export-actions">
        <button pButton label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" [outlined]="true" (click)="exportPdf()"></button>
        <button pButton label="Exportar Excel" icon="pi pi-file-excel" severity="success" [outlined]="true" (click)="exportExcel()"></button>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Category Donut -->
        <div class="chart-card">
          <h3>Gastos por Categoría</h3>
          <div class="chart-container">
            <canvas #categoryChart></canvas>
          </div>
        </div>

        <!-- Monthly Trend -->
        <div class="chart-card">
          <h3>Tendencia Mensual</h3>
          <div class="chart-container">
            <canvas #trendChart></canvas>
          </div>
        </div>

        <!-- Income vs Expenses -->
        <div class="chart-card span-full">
          <h3>Ingresos vs Gastos</h3>
          <div class="chart-container wide">
            <canvas #comparisonChart></canvas>
          </div>
        </div>
      </div>

      <!-- Summary Table -->
      <div class="summary-table-card">
        <h3>Resumen del Mes</h3>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-right">Presupuesto</th>
              <th class="text-right">Gastado</th>
              <th class="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            @for (row of tableData; track row.category) {
              <tr>
                <td>{{ row.category }}</td>
                <td class="text-right currency-sm">{{ row.budget | currencyFormat }}</td>
                <td class="text-right currency-sm" [class.expense-color]="row.spent > row.budget">{{ row.spent | currencyFormat }}</td>
                <td class="text-right">
                  <p-tag
                    [value]="row.percentage + '%'"
                    [severity]="row.percentage > 100 ? 'danger' : row.percentage > 80 ? 'warn' : 'success'"
                    [rounded]="true"
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .reports-page { @include flex-column; gap: $spacing-6; }

    .export-actions {
      display: flex;
      gap: $spacing-3;
      flex-wrap: wrap;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;
      @include mobile-only { grid-template-columns: 1fr; }
    }

    .chart-card {
      @include card;
      @include flex-column;
      gap: $spacing-4;

      h3 { font-size: $font-size-base; font-weight: $font-weight-semibold; }

      &.span-full { grid-column: 1 / -1; }
    }

    .chart-container { position: relative; height: 250px; }
    .chart-container.wide { height: 300px; }

    .summary-table-card {
      @include card;
      @include flex-column;
      gap: $spacing-4;
      overflow-x: auto;

      h3 { font-size: $font-size-base; font-weight: $font-weight-semibold; }
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;

      th {
        padding: $spacing-3;
        text-align: left;
        font-weight: $font-weight-semibold;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
        font-size: $font-size-xs;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      td {
        padding: $spacing-3;
        border-bottom: 1px solid var(--divider-color);
      }

      tr:last-child td { border-bottom: none; }
    }
  `]
})
export class ReportsPage implements AfterViewInit {
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comparisonChart') comparisonChartRef!: ElementRef<HTMLCanvasElement>;

  tableData = [
    { category: 'Alimentación', budget: 500000, spent: 380000, percentage: 76 },
    { category: 'Transporte', budget: 300000, spent: 210000, percentage: 70 },
    { category: 'Servicios', budget: 400000, spent: 390000, percentage: 97 },
    { category: 'Entretenimiento', budget: 200000, spent: 85000, percentage: 42 },
    { category: 'Restaurantes', budget: 150000, spent: 165000, percentage: 110 },
    { category: 'Salud', budget: 250000, spent: 120000, percentage: 48 },
  ];

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 100);
  }

  private initCharts(): void {
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748B';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#E2E8F0';

    // Donut Chart
    new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Restaurantes', 'Salud'],
        datasets: [{
          data: [380000, 210000, 390000, 85000, 165000, 120000],
          backgroundColor: ['#F59E0B', '#6366F1', '#F97316', '#A855F7', '#F43F5E', '#EC4899'],
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 11 }, color: textColor } },
        },
      },
    });

    // Line Chart — Trend
    new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Ingresos',
            data: [3200000, 3200000, 3500000, 3200000, 3400000, 3200000],
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'Gastos',
            data: [2100000, 2400000, 1900000, 2300000, 2000000, 1350000],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
        },
        plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
      },
    });

    // Bar Chart — Comparison
    new Chart(this.comparisonChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Ingresos',
            data: [3200000, 3200000, 3500000, 3200000, 3400000, 3200000],
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderRadius: 6,
          },
          {
            label: 'Gastos Fijos',
            data: [800000, 800000, 850000, 800000, 820000, 450000],
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 6,
          },
          {
            label: 'Gastos Variables',
            data: [1300000, 1600000, 1050000, 1500000, 1180000, 900000],
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { stacked: false, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
        },
        plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
      },
    });
  }

  async exportPdf(): Promise<void> {
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs;

    const docDefinition: any = {
      content: [
        { text: 'FamyPay — Reporte Mensual', style: 'header' },
        { text: `Generado el ${new Date().toLocaleDateString('es-CO')}`, style: 'subheader' },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              ['Categoría', 'Presupuesto', 'Gastado', '%'],
              ...this.tableData.map(r => [
                r.category,
                `$${r.budget.toLocaleString('es-CO')}`,
                `$${r.spent.toLocaleString('es-CO')}`,
                `${r.percentage}%`
              ]),
            ],
          },
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, color: '#666' },
      },
    };

    pdfMake.default.createPdf(docDefinition).download('FamyPay-Reporte.pdf');
  }

  async exportExcel(): Promise<void> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte Mensual');

    sheet.columns = [
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Presupuesto', key: 'budget', width: 15 },
      { header: 'Gastado', key: 'spent', width: 15 },
      { header: '%', key: 'percentage', width: 10 },
    ];

    this.tableData.forEach(row => sheet.addRow(row));

    // Estilo header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FamyPay-Reporte.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const REPORTS_ROUTES: Routes = [
  { path: '', component: ReportsPage, title: 'Reportes — FamyPay' }
];
