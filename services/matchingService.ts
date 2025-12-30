import Fuse from 'fuse.js';
import { MasterRow, MatchResult, ProcessedRow } from '../types';
import { normalizeCPF, normalizeName } from '../utils/normalization';

export const runMatching = (
  processedRows: ProcessedRow[],
  masterRows: MasterRow[],
  fuzzyThreshold: number = 0.85
): { results: MatchResult[], stats: any } => {
  
  // 1. Index Master Data for Performance
  const cpfMap = new Map<string, MasterRow>();
  const nameExactMap = new Map<string, MasterRow>();
  
  // Fuse.js Index for Fuzzy matching
  // We prepare a list of simplified objects for Fuse
  const masterSearchList = masterRows.map(m => ({
    ...m,
    nameNormalized: normalizeName(m.NOME)
  }));

  masterRows.forEach(row => {
    const cpf = normalizeCPF(row.CPF);
    if (cpf) cpfMap.set(cpf, row);
    
    const nameNorm = normalizeName(row.NOME);
    if (nameNorm) nameExactMap.set(nameNorm, row);
  });

  const fuse = new Fuse(masterSearchList, {
    keys: ['nameNormalized'],
    includeScore: true,
    threshold: 0.4, // Fuse threshold is distance-based (0 is exact, 1 is no match)
    // We want high similarity. In Fuse 0.0 is perfect, 1.0 is bad.
    // The user input threshold is Similarity (0.85). 
    // Fuse distance equivalent roughly = 1 - similarity.
    // So 0.85 similarity ~ 0.15 threshold in Fuse. 
    // However, Fuse logic is complex. Let's use a looser Fuse threshold search and filter manually by score.
  });

  const results: MatchResult[] = [];
  const stats = {
    totalRows: processedRows.length,
    matchedCpf: 0,
    matchedNameExact: 0,
    matchedNameFuzzy: 0,
    unmatched: 0
  };

  processedRows.forEach(row => {
    let match: MasterRow | undefined;
    let matchType: MatchResult['matchType'] = 'NONE';
    let score = 0;

    // 1. Exact CPF Match
    if (row.cpfNormalized && cpfMap.has(row.cpfNormalized)) {
      match = cpfMap.get(row.cpfNormalized);
      matchType = 'CPF_EXACT';
      stats.matchedCpf++;
    } 
    // 2. Exact Name Match
    else if (row.nameNormalized && nameExactMap.has(row.nameNormalized)) {
      match = nameExactMap.get(row.nameNormalized);
      matchType = 'NAME_EXACT';
      stats.matchedNameExact++;
    } 
    // 3. Fuzzy Name Match
    else if (row.nameNormalized) {
      const fuseResults = fuse.search(row.nameNormalized);
      if (fuseResults.length > 0) {
        const bestFit = fuseResults[0];
        // Fuse score: 0 = perfect. 1 = bad.
        // User Threshold: 0.85 (similarity) => 0.15 (distance)
        const distanceThreshold = 1 - fuzzyThreshold;
        
        if (bestFit.score !== undefined && bestFit.score <= distanceThreshold) {
          match = bestFit.item;
          matchType = 'NAME_FUZZY';
          score = 1 - bestFit.score;
          stats.matchedNameFuzzy++;
        }
      }
    }

    if (matchType === 'NONE') {
      stats.unmatched++;
    }

    results.push({
      row,
      matchType,
      masterData: match,
      score,
      status: row.comissao > 0 ? 'LIBERADO' : 'SEM COMISSÂO'
    });
  });

  return { results, stats };
};
