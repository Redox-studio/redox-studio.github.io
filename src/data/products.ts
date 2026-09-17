export interface Product {
  name: string;
  category: "App" | "Game" | "Digital experience";
  href: string;
  description: string;
}

export const products: Product[] = [
  {
    name: "潜历",
    category: "App",
    href: "/qianli/",
    description: "什么时候，去哪潜？",
  },
];
