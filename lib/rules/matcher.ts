type MatchableFaq = {
  id: string;
  question: string;
  answer: string;
};

export type FaqMatch = {
  faq: MatchableFaq;
  keyword: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "we",
  "what",
  "when",
  "where",
  "with",
  "you",
  "your"
]);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalizeKeyword(keyword: string) {
  if (keyword.length <= 3) {
    return keyword;
  }

  if (keyword.endsWith("ies") && keyword.length > 4) {
    return `${keyword.slice(0, -3)}y`;
  }

  if (keyword.endsWith("ing") && keyword.length > 5) {
    const root = keyword.slice(0, -3);
    return root.endsWith("c") ? `${root}e` : root;
  }

  if (keyword.endsWith("s") && keyword.length > 4) {
    return keyword.slice(0, -1);
  }

  return keyword;
}

export function getKeywords(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map(canonicalizeKeyword)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function matchFaq(message: string, faqs: MatchableFaq[]): FaqMatch | null {
  const messageKeywords = new Set(getKeywords(message));

  if (!messageKeywords.size) {
    return null;
  }

  for (const faq of faqs) {
    const faqKeywords = getKeywords(`${faq.question} ${faq.answer}`);
    const keyword = faqKeywords.find((word) => messageKeywords.has(word));

    if (keyword) {
      return { faq, keyword };
    }
  }

  return null;
}
