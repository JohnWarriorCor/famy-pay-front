import { Pipe, PipeTransform } from '@angular/core';
import { CURRENCY_CONFIG } from '../../core/constants/app.constants';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, showSign = false): string {
    if (value == null) return '$0';

    const formatted = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
      style: 'currency',
      currency: CURRENCY_CONFIG.default,
      minimumFractionDigits: CURRENCY_CONFIG.decimals,
      maximumFractionDigits: CURRENCY_CONFIG.decimals,
    }).format(Math.abs(value));

    if (showSign && value !== 0) {
      return value > 0 ? `+${formatted}` : `-${formatted}`;
    }

    return value < 0 ? `-${formatted}` : formatted;
  }
}
