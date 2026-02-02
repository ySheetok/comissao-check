
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { MatchResult, ProcessedRow, PromoterType } from '../types';

// Legacy wrapper for simple use cases
export const readExcelFile = async (file: File): Promise<any[]> => {
  const { data } = await getWorkbookAndData(file);
  return data;
};

// Advanced function to get the Workbook and perform initial detection
export const getWorkbookAndData = async (file: File): Promise<{ workbook: XLSX.WorkBook, sheetNames: string[], data: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames;
        
        if (sheetNames.length === 0) throw new Error("Arquivo vazio");

        // Default to first sheet
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        
        resolve({ workbook, sheetNames, data: jsonData });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

// Parse a specific sheet with a specific header row index (0-based)
export const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string, headerRowIndex: number): any[] => {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  // range: headerRowIndex tells XLSX to start reading from that row.
  // The row at headerRowIndex becomes the keys.
  return XLSX.utils.sheet_to_json(worksheet, { 
    defval: "",
    range: headerRowIndex 
  });
};

// Helper to detect where the header likely is (Row 1 or Row 2)
// Returns 0 (Row 1) or 1 (Row 2) based on finding keywords
export const detectHeaderRow = (workbook: XLSX.WorkBook, sheetName: string): number => {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return 0;

  // Read first 5 rows as arrays of arrays to inspect content
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' }) as string[][];

  if (rawRows.length === 0) return 0;

  const keywords = ['VENDEDOR', 'NOME', 'CPF', 'CLIENTE'];
  
  // Check row 0
  const row0Str = (rawRows[0] || []).join(' ').toUpperCase();
  const score0 = keywords.filter(k => row0Str.includes(k)).length;

  // Check row 1
  const row1Str = (rawRows[1] || []).join(' ').toUpperCase();
  const score1 = keywords.filter(k => row1Str.includes(k)).length;

  // If row 1 has more keywords than row 0, assume row 1 is header
  if (score1 > score0) return 1;

  return 0;
};

const formatCurrency = (val: number) => {
  return val; 
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
        'STATUS': res.status,
        'EMISSÃO': res.row.dataEmissao,
        'ARQUIVO (PROMOTORA)': res.row.fileName,
        'ARQUIVO (MESTRE)': res.masterData?.fileName || ''
      });
    } else {
      pendenciasData.push({
        'PROMOTORA': res.row.promoterType,
        'CLIENTE': res.row.cliente,
        'CPF': res.row.cpfNormalized,
        'BANCO': res.row.banco,
        'PRODUTO': res.row.produto,
        'USUARIO': res.row.usuario,
        'DATA RELATORIO': dataRelatorioFormatted,
        'EMISSÃO': res.row.dataEmissao,
        'ARQUIVO (PROMOTORA)': res.row.fileName
      });
    }
  });

  const wb = XLSX.utils.book_new();

  const wsFound = XLSX.utils.json_to_sheet(foundData);
  const wsPendencias = XLSX.utils.json_to_sheet(pendenciasData);

  // Updated cols width including Emissão and Arquivos
  wsFound['!cols'] = [
    { wch: 15 }, // Promotora
    { wch: 30 }, // Cliente
    { wch: 15 }, // CPF
    { wch: 15 }, // Banco
    { wch: 10 }, // Orgao
    { wch: 12 }, // Valor
    { wch: 10 }, // Data
    { wch: 8 },  // %
    { wch: 20 }, // Produto
    { wch: 20 }, // Vendedor
    { wch: 10 }, // Filial
    { wch: 12 }, // Comissao
    { wch: 15 }, // Status
    { wch: 12 }, // Emissao
    { wch: 25 }, // Arq Promotora
    { wch: 25 }  // Arq Mestre
  ];

  wsPendencias['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 25 }
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
