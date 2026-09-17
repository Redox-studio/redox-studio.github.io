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
    description: "TODO · 产品简介待提供。",
  },
];
