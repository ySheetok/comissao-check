
import { ProcessedRow, PromoterType, UploadedFile } from '../types';
import { normalizeCPF, normalizeName, parseCurrency, parsePercentage, formatExcelDate } from '../utils/normalization';

// Helper to safely get nested or case-insensitive property
const getProp = (obj: any, key: string) => {
  if (!obj) return undefined;
  // Direct access
  if (obj[key] !== undefined) return obj[key];
  // Case insensitive
  const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
  return foundKey ? obj[foundKey] : undefined;
};

// Helper to sum duplicate columns (like in Port file: "Comissão %")
const getSumOfColumns = (row: any, baseName: string, parser: (v: any) => number): number => {
  let sum = 0;
  // Check base
  const val1 = getProp(row, baseName);
  if (val1) sum += parser(val1);

  // Check suffixed versions (common behavior of JS XLS parsers)
  const val2 = getProp(row, baseName + '_1');
  if (val2) sum += parser(val2);

  return sum;
};

// Specific parser for Port percentages which can be fractions (e.g. 0,025 -> 2.5)
const parsePortPercentage = (value: any): number => {
  let str = value;
  // Remove % symbol if string
  if (typeof str === 'string') {
    str = str.replace('%', '').trim();
  }
  
  // Parse as currency (handles commas/dots)
  const num = parseCurrency(str);
  
  // If the numeric value is LESS THAN 1 (and > 0), treat it as a fraction and multiply by 100
  // Example: 0.025 -> 2.5
  if (num > 0 && num < 1) {
    return num * 100;
  }
  
  return num;
};

export const processPromoterRow = (row: any, type: PromoterType, fileName: string): ProcessedRow => {
  const id = Math.random().toString(36).substring(7);
  let cliente = '';
  let cpfRaw = '';
  let banco = '';
  let orgao = '-';
  let valor = 0;
  let percentual = 0;
  let produto = '';
  let comissao = 0;
  let usuario = '';
  let dataEmissao = '';

  const checkINSS = (...values: string[]) => {
    return values.some(v => v && String(v).toLowerCase().includes('inss')) ? 'INSS' : '-';
  };

  switch (type) {
    case PromoterType.PORT:
      cliente = getProp(row, 'Cliente') || getProp(row, 'CLIENTE') || '';
      cpfRaw = getProp(row, 'CPF') || '';
      banco = getProp(row, 'Banco') || '';
      
      const convenioPort = getProp(row, 'Convenio') || '';
      orgao = checkINSS(convenioPort);
      
      valor = parseCurrency(getProp(row, 'Valor Líquido'));
      percentual = getSumOfColumns(row, 'Comissão %', parsePortPercentage);
      produto = getProp(row, 'Produto') || '';
      comissao = parseCurrency(getProp(row, 'Vlr. Pagto.'));
      usuario = getProp(row, 'Digitador') || '';
      
      // Port: 'Emissão'
      dataEmissao = formatExcelDate(getProp(row, 'Emissão') || getProp(row, 'Emissao'));
      break;

    case PromoterType.CREDFORYOU:
      cliente = getProp(row, 'CLIENTE') || '';
      cpfRaw = getProp(row, 'CPF') || '';
      
      const descrConvenio = getProp(row, 'DESCR CONVENIO') || '';
      banco = descrConvenio.split(' ')[0] || '';
      orgao = checkINSS(descrConvenio);
      
      valor = parseCurrency(getProp(row, 'VLR_LIQUIDO'));
      percentual = parsePercentage(getProp(row, '%_PGTO'));
      produto = descrConvenio; 
      
      const vlrPgto1 = parseCurrency(getProp(row, 'VLR_PGTO'));
      const vlrPgto2 = parseCurrency(getProp(row, 'VLR_PGTO2'));
      comissao = vlrPgto1 + vlrPgto2;
      
      usuario = getProp(row, 'ATENDENTE') || getProp(row, 'COD_USUARIO') || '';
      
      // CredForYou: 'DT_EMISSAO'
      dataEmissao = formatExcelDate(getProp(row, 'DT_EMISSAO'));
      break;

    case PromoterType.CIA_DO_CREDITO:
      cliente = getProp(row, 'CLIENTE') || '';
      cpfRaw = getProp(row, 'CPF') || '';
      banco = getProp(row, 'BANCO') || getProp(row, 'Banco') || '';
      
      produto = getProp(row, 'PRODUTO') || '';
      orgao = checkINSS(produto);
      
      valor = parseCurrency(getProp(row, 'VAL. LÍQUIDO'));
      percentual = parsePercentage(getProp(row, '% PAGO'));
      comissao = parseCurrency(getProp(row, 'VAL. COMISSÃO'));
      
      usuario = getProp(row, 'DIGITADOR') || '';
      
      // Cia do Credito: 'CRC'
      dataEmissao = formatExcelDate(getProp(row, 'CRC'));
      break;

    default:
      // GENERIC mapping attempt
      cliente = getProp(row, 'CLIENTE') || getProp(row, 'NOME') || '';
      cpfRaw = getProp(row, 'CPF') || '';
      banco = getProp(row, 'BANCO') || '';
      produto = getProp(row, 'PRODUTO') || '';
      orgao = checkINSS(produto);
      valor = parseCurrency(getProp(row, 'VALOR') || getProp(row, 'LIQUIDO') || getProp(row, 'VALOR LIQUIDO'));
      percentual = parsePercentage(getProp(row, '%') || getProp(row, 'PERCENTUAL'));
      comissao = parseCurrency(getProp(row, 'COMISSAO') || getProp(row, 'VALOR COMISSAO'));
      usuario = getProp(row, 'USUARIO') || getProp(row, 'DIGITADOR') || '';
      dataEmissao = formatExcelDate(getProp(row, 'DATA EMISSAO') || getProp(row, 'EMISSAO') || getProp(row, 'DATA'));
      break;
  }

  return {
    id,
    originalRow: row,
    promoterType: type,
    fileName,
    cpfNormalized: normalizeCPF(cpfRaw),
    nameNormalized: normalizeName(cliente),
    cliente: cliente,
    banco: banco,
    orgao: orgao,
    valor: valor,
    data: new Date(),
    dataEmissao: dataEmissao,
    percentual: percentual,
    produto: produto,
    comissao: comissao,
    usuario: usuario
  };
};

export const processFile = (file: UploadedFile): ProcessedRow[] => {
  if (!file.promoterType) return [];
  return file.data.map(row => processPromoterRow(row, file.promoterType!, file.name));
};
