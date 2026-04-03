
## Onboarding + UX para Primeira Experiência

### 1. Tela de Boas-vindas (Welcome Screen)
- Após primeiro login, exibir modal/página de boas-vindas com:
  - Nome do escritório (já cadastrado no signup)
  - Passos rápidos: "Cadastre seu primeiro membro da equipe", "Cadastre seu primeiro processo", "Crie seu primeiro prazo"
  - Botão "Começar agora" que leva ao dashboard

### 2. Dashboard com Estado Vazio Inteligente
- Quando não houver dados, mostrar cards com CTAs:
  - "Cadastre seu primeiro processo" → link para /cases/new
  - "Adicione um membro da equipe" → link para /team
  - "Crie seu primeiro prazo" → link para /deadlines
- Barra de progresso de onboarding (ex: 0/3 passos concluídos)

### 3. Checklist de Configuração Inicial
- Pequeno widget no dashboard (dismissível) mostrando:
  - ☐ Cadastrar membro da equipe
  - ☐ Cadastrar primeiro contato
  - ☐ Cadastrar primeiro processo
  - ☐ Criar primeiro prazo
- Cada item é marcado automaticamente quando o dado existe no banco

### 4. Melhorias de UX Gerais
- Tooltips em ícones/ações principais
- Breadcrumbs mais claros nas páginas de detalhe
