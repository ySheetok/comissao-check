export enum PromoterType {
  PORT = 'PORT',
  CREDFORYOU = 'CREDFORYOU',
  CIA_DO_CREDITO = 'CIA DO CRÉDITO',
  GENERIC = 'GENÉRICO'
}

export interface MasterRow {
  VENDEDOR: string;
  NOME: string;
  CPF: string;
}

export interface ProcessedRow {
  // Common fields for processing
  id: string; // unique internal id
  originalRow: any;
  promoterType: PromoterType;
  fileName: string;
  
  // Normalized fields for matching
  cpfNormalized: string;
  nameNormalized: string;
  
  // Extracted data for output
  cliente: string;
  banco: string;
  orgao: string;
  valor: number;
  data: Date;
  percentual: number;
  produto: string;
  comissao: number;
  usuario: string; // for pendencias
}

export interface MatchResult {
  row: ProcessedRow;
  matchType: 'CPF_EXACT' | 'NAME_EXACT' | 'NAME_FUZZY' | 'NONE';
  masterData?: MasterRow;
  score?: number; // 0 to 1, 0 is best match in Fuse.js usually, but we might normalize
  status: 'LIBERADO' | 'SEM COMISSÂO';
}

export interface ProcessingStats {
  totalRows: number;
  matchedCpf: number;
  matchedNameExact: number;
  matchedNameFuzzy: number;
  unmatched: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'MASTER' | 'PROMOTER';
  data: any[]; // Raw JSON from xlsx
  promoterType?: PromoterType; // Only for promoter files
}
