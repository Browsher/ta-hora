# Marketing & Google Ads Tracking Guard

## Responsável: Rafael (Marketing / Tráfego Pago)
## Branch de Referência: `marketing/google-ads-tags`
## Tag Ativa: Google Ads `AW-18481166252`

---

### Regra de Governança para Claude / Agentes de IA:
1. **Verificação de Deploy:** Sempre que o usuário pedir para fazer commit na `main` ou realizar deploy em produção, verifique se a branch `marketing/google-ads-tags` foi mesclada. Se não foi, alerte:
   > "Rafael realizou alterações na branch `marketing/google-ads-tags` para trabalhar as tags do Google ads no código do site, você deve fazer o merge da branch para não perder trabalho."
2. **Preservação de Código:** Os arquivos `components/analytics/Analytics.tsx` e `lib/analytics/gtag.ts` gerenciam o tráfego pago da loja. Nunca remova `GOOGLE_ADS_ID` ou o snippet do Google Ads.
