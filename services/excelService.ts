import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MatchResult, ProcessedRow, PromoterType } from '../types';

export const readExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

const formatCurrency = (val: number) => {
  return val; // We let Excel handle formatting via cell styles if we were using a pro library, but here we output raw numbers for calculation safety or string formatted
};

export const exportToExcel = (results: MatchResult[]) => {
  const foundData: any[] = [];
  const pendenciasData: any[] = [];

  const today = new Date();
  const dataFormatted = format(today, 'dd/MMM', { locale: ptBR });
  const dataRelatorioFormatted = format(today, "d 'de' MMMM", { locale: ptBR });

  results.forEach(res => {
    if (res.matchType !== 'NONE') {
      foundData.push({
        'PROMOTORA': res.row.promoterType,
        'CLIENTE': res.row.cliente,
        'CPF': res.row.cpfNormalized,
        'BANCO': res.row.banco,
        'ÓRGÃO': res.row.orgao,
        'VALOR': res.row.valor,
        'DATA': dataFormatted,
        '%': res.row.percentual,
        'PRODUTO': res.row.produto,
        'VENDEDOR': res.masterData?.VENDEDOR || '',
        'FILIAL': '',
        'COMISSÃO': res.row.comissao,
        'STATUS': res.status
      });
    } else {
      pendenciasData.push({
        'PROMOTORA': res.row.promoterType,
        'CLIENTE': res.row.cliente,
        'CPF': res.row.cpfNormalized,
        'BANCO': res.row.banco,
        'PRODUTO': res.row.produto,
        'USUARIO': res.row.usuario,
        'DATA RELATORIO': dataRelatorioFormatted
      });
    }
  });

  const wb = XLSX.utils.book_new();

  const wsFound = XLSX.utils.json_to_sheet(foundData);
  const wsPendencias = XLSX.utils.json_to_sheet(pendenciasData);

  // Set column widths roughly
  wsFound['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
    { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, 
    { wch: 10 }, { wch: 12 }, { wch: 15 }
  ];

  wsPendencias['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(wb, wsFound, "Found");
  XLSX.utils.book_append_sheet(wb, wsPendencias, "Pendências");

  XLSX.writeFile(wb, `Auditoria_Comissoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
};

export const exportGeneric = (data: any[], fileName: string, sheetName: string = "Dados") => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};
