
import { PromoterType } from '../types';
import { addDays, format } from 'date-fns';

export const normalizeCPF = (cpf: string | number | undefined): string => {
  if (!cpf) return '';
  const str = String(cpf);
  // Remove all non-digits
  return str.replace(/\D/g, '');
};

export const formatCPF = (cpf: string): string => {
  const digits = normalizeCPF(cpf);
  return digits.padStart(11, '0');
};

export const normalizeName = (name: string | undefined): string => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

export const parseCurrency = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  
  // Check format 1.234,56 (Brazilian) vs 1,234.56 (US)
  // Heuristic: look for the last separator
  const lastCommaIndex = str.lastIndexOf(',');
  const lastDotIndex = str.lastIndexOf('.');

  let cleanStr = str.replace(/[^\d.,-]/g, ''); // Keep digits, dots, commas, negative sign

  if (lastCommaIndex > lastDotIndex) {
    // Brazilian format likely: 1.000,00
    // Remove dots, replace comma with dot
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (lastDotIndex > lastCommaIndex) {
    // US format likely: 1,000.00
    // Remove commas
    cleanStr = cleanStr.replace(/,/g, '');
  } else {
    // No separators or just one type. 
    // If it has comma, assume it is decimal separator if Portuguese context usually
    cleanStr = cleanStr.replace(',', '.');
  }

  const result = parseFloat(cleanStr);
  return isNaN(result) ? 0 : result;
};

export const parsePercentage = (value: string | number | undefined): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value * 100 > 1000 ? value : value; // If raw number 0.015 -> 1.5%. If 1.5 -> 1.5%

  let str = String(value).trim().replace('%', '');
  return parseCurrency(str);
};

export const formatExcelDate = (value: any): string => {
  if (!value) return '';
  
  // If number (Excel serial)
  if (typeof value === 'number') {
    // Excel base date: Dec 30, 1899
    // Adjust for Excel leap year bug (1900 is not leap year but Excel thinks it is), but for modern dates usually fine
    try {
      const date = addDays(new Date(1899, 11, 30), value);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy');
      }
    } catch (e) {
      return String(value);
    }
  }
  
  // If string, return as is (assuming it's readable) or try to simple parse
  // Many CSVs have 'DD/MM/YYYY' already.
  return String(value);
};

export const detectPromoterType = (headers: string[]): PromoterType => {
  const headerStr = headers.join(' ').toUpperCase();
  
  if (headerStr.includes('FORMA LIBERAÇÃO') && headerStr.includes('VLR. PAGTO.') && headerStr.includes('COMISSÃO %')) {
    return PromoterType.PORT;
  }
  
  if (headerStr.includes('NOME CORRESPONDENTE') && headerStr.includes('FECH_ID') && headerStr.includes('DESCR CONVENIO')) {
    return PromoterType.CREDFORYOU;
  }
  
  if (headerStr.includes('AG PROPOSTA') && headerStr.includes('VAL. LÍQUIDO') && headerStr.includes('BAIXA CMS')) {
    return PromoterType.CIA_DO_CREDITO;
  }

  return PromoterType.GENERIC;
};
