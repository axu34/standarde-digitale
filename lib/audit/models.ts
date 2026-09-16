export const MODEL_CATALOG = [
  {
    key: "spring",
    label: "Spring",
    re: /\bspring\b/i,
    skipPrice: false,
    order: 1,
  },
  {
    key: "noul-spring",
    label: "Noul Spring",
    re: /noul\s+spring/i,
    skipPrice: true,
    order: 2,
  },
  {
    key: "sandero",
    label: "Sandero",
    re: /\bsandero\b/i,
    skipPrice: false,
    order: 3,
  },
  {
    key: "stepway",
    label: "Sandero Stepway",
    re: /\bstepway\b/i,
    skipPrice: false,
    order: 4,
  },
  {
    key: "logan",
    label: "Logan",
    re: /\blogan\b/i,
    skipPrice: false,
    order: 5,
  },
  {
    key: "jogger",
    label: "Jogger",
    re: /\bjogger\b/i,
    skipPrice: false,
    order: 6,
  },
  {
    key: "duster",
    label: "Duster",
    re: /\bduster\b/i,
    skipPrice: false,
    order: 7,
  },
  {
    key: "bigster",
    label: "Bigster",
    re: /\bbigster\b/i,
    skipPrice: false,
    order: 8,
  },
  {
    key: "striker",
    label: "Striker",
    re: /\bstriker\b/i,
    skipPrice: true,
    order: 9,
  },
] as const;

export const TNP_ORDER = [
  "spring",
  "noul-spring",
  "sandero",
  "stepway",
  "logan",
  "jogger",
  "duster",
  "bigster",
  "striker",
] as const;

export const OTHER_BRANDS = [
  "Renault",
  "Alpine",
  "Nissan",
  "Mitsubishi",
  "Ford",
  "Volkswagen",
  "VW",
  "Škoda",
  "Skoda",
  "Seat",
  "Cupra",
  "Peugeot",
  "Citroën",
  "Citroen",
  "Opel",
  "Toyota",
  "Hyundai",
  "Kia",
  "Mercedes",
  "BMW",
  "Audi",
  "Volvo",
];

export function orderPenalty(foundKeys: string[]): {
  ok: boolean;
  expected: string[];
  actual: string[];
} {
  const allowed = new Set<string>(TNP_ORDER);
  const actual = foundKeys.filter((k) => allowed.has(k));
  const expected = TNP_ORDER.filter((k) => actual.includes(k));
  const ok = actual.join() === expected.join();
  return { ok, expected, actual };
}
