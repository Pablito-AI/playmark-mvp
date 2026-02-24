export const CATEGORIES = [
  "Deportes",
  "Política",
  "Economía",
  "IA",
  "Tecnología",
  "Cripto",
  "Cultura",
  "Influencers",
  "Sociedad",
  "Otros"
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isValidCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}
