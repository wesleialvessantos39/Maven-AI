# Fundação para SaaS multiempresa

Esta base mantém o login e o CRUD de tarefas por usuário do template web. Inclui uma migration adicional para empresas e memberships com políticas RLS. Ainda é necessário integrar a seleção de empresa à interface, adicionar tenant_id às entidades de negócio e autorizar cada operação no backend. O CRUD de exemplo não se torna multiempresa automaticamente.

1. Revise e aplique as migrations em um banco de teste.
2. O provisionamento de empresas/membros deve ocorrer em um backend confiável, com convite e verificação de papel. Usuários autenticados não recebem permissão de inserir ou alterar memberships diretamente.
3. Adicione planos de assinatura e cotas no servidor; nunca confie no plano recebido do navegador. Cobrança exige integração real com provedor, webhooks com assinatura validada, idempotência e reconciliação.
4. Crie testes com usuários de duas empresas, incluindo leitura, criação, atualização, exclusão e acesso por IDs adivinhados.
5. Defina trilha de auditoria, retenção, backups, recuperação e observabilidade antes de hospedar.

Não exponha service_role no frontend. A migration é um ponto de partida que deve ser revisado e testado para seu produto.
