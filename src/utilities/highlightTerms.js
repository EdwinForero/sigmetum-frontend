export const highlightTerms = (text, terms) => {
  if (!text || !terms || !Array.isArray(terms) || terms.length === 0) {
    return [{ text, isItalic: true }];
  }

  const filteredTerms = terms
    .map(term => (typeof term === 'object' && term.term ? term.term : term))
    .filter(term => typeof term === 'string' && term.trim() !== '');

  if (filteredTerms.length === 0) {
    return [{ text, isItalic: true }];
  }

  const escapedTerms = filteredTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(\\s|^)(${escapedTerms.join('|')})(\\s|$)`, 'gi');

  return text.split(regex).map(part => ({
    text: part,
    isItalic: !filteredTerms.some(term => term.toLowerCase() === part.toLowerCase()),
  }));
};
