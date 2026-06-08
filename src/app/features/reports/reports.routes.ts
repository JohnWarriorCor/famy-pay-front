import { Routes } from '@angular/router';
import { Component, signal, ViewChild, ElementRef, AfterViewInit, inject, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Chart, registerables } from 'chart.js';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { FamilySpaceService } from '../family-space/services/family-space.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { BudgetService } from '../budgets/services/budget.service';
import { CategoryService } from '../transactions/services/category.service';
import { Transaction, Budget } from '../../core/models';

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
            @for (row of tableData(); track row.category) {
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

    .reports-page { 
      @include flex-column; 
      gap: $spacing-6; 
      max-width: 100%;
      overflow-x: hidden;
    }

    .export-actions {
      display: flex;
      gap: $spacing-3;
      flex-wrap: wrap;
      
      @include mobile-only {
        button {
          flex: 1;
          min-width: 130px;
        }
      }
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;
      max-width: 100%;
      @include mobile-only { grid-template-columns: 1fr; }
    }

    .chart-card {
      @include card;
      @include flex-column;
      gap: $spacing-4;
      min-width: 0; /* Permite que el grid item se encoja por debajo del ancho de la gráfica */
      max-width: 100%;

      h3 { font-size: $font-size-base; font-weight: $font-weight-semibold; }

      &.span-full { grid-column: 1 / -1; }
    }

    .chart-container { 
      position: relative; 
      height: 250px; 
      width: 100%; 
      max-width: 100%;
    }
    
    .chart-container.wide { 
      height: 300px; 
      width: 100%; 
      max-width: 100%;
    }

    canvas {
      max-width: 100% !important;
    }

    .summary-table-card {
      @include card;
      @include flex-column;
      gap: $spacing-4;
      overflow-x: auto;
      max-width: 100%;

      h3 { font-size: $font-size-base; font-weight: $font-weight-semibold; }
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;
      min-width: 450px; /* Garantiza legibilidad de la tabla con scroll interno */

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
export class ReportsPage implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comparisonChart') comparisonChartRef!: ElementRef<HTMLCanvasElement>;

  private familyService = inject(FamilySpaceService);
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);

  private categoryChart?: Chart;
  private trendChart?: Chart;
  private comparisonChart?: Chart;
  private chartsInitialized = false;

  private readonly monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  private readonly chartColors = [
    '#F59E0B', '#6366F1', '#F97316', '#A855F7', '#F43F5E', '#EC4899',
    '#14B8A6', '#3B82F6', '#8B5CF6', '#EF4444', '#22C55E', '#64748B'
  ];

  /** Tabla de resumen calculada dinámicamente desde Firestore */
  readonly tableData = computed(() => {
    const transactions = this.transactionService.transactions();
    const budgets = this.budgetService.budgets();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar gastos del mes actual
    const monthExpenses = transactions.filter(tx => {
      if (tx.type === 'income') return false;
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Agrupar gastos por categoría
    const spentByCategory = new Map<string, { name: string; spent: number }>();
    monthExpenses.forEach(tx => {
      const existing = spentByCategory.get(tx.categoryId) || { name: tx.categoryName, spent: 0 };
      existing.spent += tx.amount;
      spentByCategory.set(tx.categoryId, existing);
    });

    // Crear mapa de presupuestos por categoría
    const budgetByCategory = new Map<string, number>();
    budgets.forEach(b => budgetByCategory.set(b.categoryId, b.limit));

    // Combinar categorías (de gastos + de presupuestos)
    const allCategoryIds = new Set([...spentByCategory.keys(), ...budgetByCategory.keys()]);
    const rows: { category: string; budget: number; spent: number; percentage: number }[] = [];

    allCategoryIds.forEach(catId => {
      const spentData = spentByCategory.get(catId);
      const budgetData = budgets.find(b => b.categoryId === catId);
      const categoryName = spentData?.name || budgetData?.categoryName || 'Sin categoría';
      const spent = spentData?.spent || 0;
      const budget = budgetByCategory.get(catId) || 0;
      const percentage = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);

      rows.push({ category: categoryName, budget, spent, percentage });
    });

    return rows.sort((a, b) => b.spent - a.spent);
  });

  constructor() {
    // Redibujar gráficas cuando los datos cambien
    effect(() => {
      const table = this.tableData();
      const txs = this.transactionService.transactions();
      if (this.chartsInitialized) {
        this.updateCharts();
      }
    });
  }

  ngOnInit(): void {
    const space = this.familyService.activeSpace();
    if (space) {
      this.transactionService.listenToTransactions(space.id);
      this.budgetService.listenToBudgets(space.id, this.monthKey);
      this.categoryService.listenToCategories(space.id);
    }
  }

  ngOnDestroy(): void {
    this.categoryChart?.destroy();
    this.trendChart?.destroy();
    this.comparisonChart?.destroy();
    this.transactionService.destroy();
    this.budgetService.destroy();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
      this.chartsInitialized = true;
    }, 300);
  }

  private getTextColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748B';
  }

  private getGridColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#E2E8F0';
  }

  private initCharts(): void {
    const textColor = this.getTextColor();
    const gridColor = this.getGridColor();
    const table = this.tableData();
    const monthlyData = this.getMonthlyData();

    // Donut Chart — Gastos por categoría
    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: table.map(r => r.category),
        datasets: [{
          data: table.map(r => r.spent),
          backgroundColor: this.chartColors.slice(0, table.length),
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

    // Line Chart — Tendencia mensual
    this.trendChart = new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: 'Ingresos',
            data: monthlyData.income,
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'Gastos',
            data: monthlyData.expenses,
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

    // Bar Chart — Ingresos vs Gastos
    this.comparisonChart = new Chart(this.comparisonChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: 'Ingresos',
            data: monthlyData.income,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderRadius: 6,
          },
          {
            label: 'Gastos Fijos',
            data: monthlyData.fixedExpenses,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 6,
          },
          {
            label: 'Gastos Variables',
            data: monthlyData.variableExpenses,
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

  private updateCharts(): void {
    const table = this.tableData();
    const monthlyData = this.getMonthlyData();

    if (this.categoryChart) {
      this.categoryChart.data.labels = table.map(r => r.category);
      this.categoryChart.data.datasets[0].data = table.map(r => r.spent);
      this.categoryChart.data.datasets[0].backgroundColor = this.chartColors.slice(0, table.length);
      this.categoryChart.update();
    }

    if (this.trendChart) {
      this.trendChart.data.labels = monthlyData.labels;
      this.trendChart.data.datasets[0].data = monthlyData.income;
      this.trendChart.data.datasets[1].data = monthlyData.expenses;
      this.trendChart.update();
    }

    if (this.comparisonChart) {
      this.comparisonChart.data.labels = monthlyData.labels;
      this.comparisonChart.data.datasets[0].data = monthlyData.income;
      this.comparisonChart.data.datasets[1].data = monthlyData.fixedExpenses;
      this.comparisonChart.data.datasets[2].data = monthlyData.variableExpenses;
      this.comparisonChart.update();
    }
  }

  /** Calcular datos agrupados por mes para las gráficas de tendencia */
  private getMonthlyData(): { labels: string[]; income: number[]; expenses: number[]; fixedExpenses: number[]; variableExpenses: number[] } {
    const transactions = this.transactionService.transactions();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();

    // Últimos 6 meses
    const labels: string[] = [];
    const income: number[] = [];
    const expenses: number[] = [];
    const fixedExpenses: number[] = [];
    const variableExpenses: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      labels.push(monthNames[month]);

      const monthTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === month && txDate.getFullYear() === year;
      });

      income.push(monthTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0));
      expenses.push(monthTxs.filter(tx => tx.type !== 'income').reduce((s, tx) => s + tx.amount, 0));
      fixedExpenses.push(monthTxs.filter(tx => tx.type === 'fixedExpense').reduce((s, tx) => s + tx.amount, 0));
      variableExpenses.push(monthTxs.filter(tx => tx.type === 'variableExpense').reduce((s, tx) => s + tx.amount, 0));
    }

    return { labels, income, expenses, fixedExpenses, variableExpenses };
  }

  async exportPdf(): Promise<void> {
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs;

    const data = this.tableData();
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
              ...data.map(r => [
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

    this.tableData().forEach(row => sheet.addRow(row));

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

