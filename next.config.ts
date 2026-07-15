import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runtime (SSR/ISR) — sem `output: "export"`: a loja precisa de dados frescos
  // da Shopify (ver .claude/steering/tech.md → "Modelo de build"). As páginas de
  // conteúdo (home, Sobre Nós) continuam pré-renderizadas (SSG) normalmente.
  // `images.unoptimized` mantido: os primitivos usam <img> puro (ImageSlot).
  images: { unoptimized: true },
};

export default nextConfig;
