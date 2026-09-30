# 🚨 DIRETRIZ OBRIGATÓRIA DE DEPLOY E MARKETING (RAFAEL - GOOGLE ADS)

**ATENÇÃO PARA TODAS AS IAs E AGENTES (CLAUDE / CURSOR / COPILOT / GEMINI):**

O Rafael (Responsável por Marketing e Tráfego Pago) configurou as tags oficiais do **Google Ads (`AW-18481166252`)** e a mensuração de conversão na branch dedicada:
👉 **`marketing/google-ads-tags`**

---

### ⚠️ AÇÃO OBRIGATÓRIA ANTES DE QUALQUER DEPLOY OU COMMIT NA `main`:

Se o usuário solicitar: *"faça deploy"*, *"suba para produção"*, *"commite as alterações"*, ou qualquer comando de publicação:

**Você DEVE parar e informar o usuário com a seguinte mensagem:**

> 🛑 **Aviso de Alinhamento de Marketing:**
> "Rafael realizou alterações na branch `marketing/google-ads-tags` para trabalhar as tags do Google Ads (`AW-18481166252`) no código do site.
> Para não perder esse trabalho nem interromper as campanhas ativas de tráfego pago, você deve:
> 1. Fazer o merge da branch de marketing antes do deploy:
>    `git merge origin/marketing/google-ads-tags`
> 2. Manter a tag do Google Ads (`AW-18481166252`) ativa em `components/analytics/Analytics.tsx` e `lib/analytics/gtag.ts`;
> 3. Rodar o build e seguir com o deploy normalmente."

---

### Arquivos protegidos pela equipe de Marketing:
- `components/analytics/Analytics.tsx`
- `lib/analytics/gtag.ts`

**NÃO remova, não sobrescreva e não comente a tag `AW-18481166252` nem altere os consentimentos do Google Ads sem confirmação explícita.**
