## Módulo CRM de Atendimento

### 1. Migração do Banco de Dados
Criar as tabelas:
- **crm_columns**: colunas do Kanban (nome, cor, ordem, organization_id)
- **crm_categories**: categorias de caso personalizáveis (nome, organization_id)
- **crm_leads**: cards/leads (nome, telefone, cidade, email, categoria, resumo, drive_link, coluna, organization_id)
- **crm_lead_tags**: relação N:N entre leads e tags existentes
- **crm_lead_history**: histórico de movimentação entre colunas

Seed com colunas e categorias padrão via função.

### 2. Páginas e Componentes
- **Página `/crm`**: visualização Kanban principal com busca e filtros
- **CrmKanbanBoard**: board com drag-and-drop entre colunas
- **CrmLeadCard**: card resumido com nome, telefone, cidade, categoria, tags, atalho WhatsApp
- **AddLeadDialog**: criação rápida de lead (só nome obrigatório)
- **LeadDetailDrawer**: drawer lateral com todos os campos editáveis + histórico
- **ManageColumnsDialog**: CRUD de colunas do Kanban
- **ManageCategoriesDialog**: CRUD de categorias de caso

### 3. Navegação
- Adicionar "CRM" no sidebar

### 4. Hooks
- `useCrmColumns`: CRUD colunas
- `useCrmLeads`: CRUD leads + movimentação
- `useCrmCategories`: CRUD categorias
