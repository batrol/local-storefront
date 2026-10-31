# Plano: MVP (v0.1), um comerciante vende por um link

[🇺🇸 English](PLAN_MVP.md) · 🇧🇷 Português (Brasil)

Objetivo: o comerciante se cadastra, cria produtos, controla o estoque e compartilha o link do
catálogo público; o cliente pede sem criar conta; o comerciante vê e atualiza os pedidos. O
estoque baixa automaticamente a cada pedido.

## Tecnologias

- `api/`: Laravel 13 (PHP 8.5), tokens Sanctum, SQLite para dev/testes (migrations compatíveis
  com MySQL), PHPUnit, Pint, Larastan. Três camadas: Controller → Service → Repository.
- `web/`: React 19, Vite, TypeScript, Tailwind 4, TanStack Query, react-hook-form + zod,
  react-router, Vitest. O empacotamento Capacitor para o app mobile vem depois que as telas do
  MVP funcionarem.

## Contrato (REST, JSON, prefixo `/api`)

| Método | Caminho | Auth | Função |
|---|---|---|---|
| POST | /auth/register | não | cria usuário comerciante + loja |
| POST | /auth/login | não | token |
| POST | /auth/logout | sim | revoga o token |
| GET | /me | sim | usuário + loja |
| GET/POST | /categories | sim | listar / criar |
| PUT/DELETE | /categories/{id} | sim | atualizar / excluir |
| GET/POST | /products | sim | listar / criar |
| GET/PUT/DELETE | /products/{id} | sim | ler / atualizar / excluir |
| POST | /products/{id}/stock | sim | ajustar estoque (delta + motivo) |
| GET | /shops/{slug} | não | dados públicos da loja |
| GET | /shops/{slug}/products | não | catálogo público (produtos ativos) |
| POST | /shops/{slug}/orders | não | o cliente cria um pedido |
| GET | /orders | sim | pedidos do comerciante |
| GET | /orders/{id} | sim | detalhe do pedido |
| PATCH | /orders/{id}/status | sim | mudar o status |

Status do pedido (MVP): `pending → confirmed → ready → completed`, ou `cancelled` (o
cancelamento devolve o estoque). Preços em centavos inteiros.

## Tarefas (marque quando estiver integrada e funcionando)

### Backend
- [x] B1 Esqueleto de `api/`, SQLite, Sanctum, Pint, Larastan, notas de arquitetura
- [x] B2 Autenticação: cadastro (usuário + loja com slug), login, logout, me
- [x] B3 CRUD de categorias e produtos, restrito à loja do comerciante
- [x] B4 Ajuste de estoque com registro de movimentações e aviso de estoque baixo
- [x] B5 Catálogo público pelo slug da loja
- [x] B6 Pedidos: criar (baixa de estoque transacional, validação), listar, detalhar, mudar status, cancelar devolve o estoque
- [x] B7 Testes de feature para todos os endpoints, incluindo isolamento entre lojas

### Frontend
- [x] F1 Esqueleto de `web/` (Vite, TS, Tailwind 4, router, query, Vitest), cliente da API com token
- [x] F2 Páginas de autenticação e rotas protegidas
- [x] F3 Comerciante: páginas de categorias e produtos, ajuste de estoque, selo de estoque baixo
- [x] F4 Página pública da loja, carrinho, formulário de pedido
- [x] F5 Lista e detalhe dos pedidos do comerciante com ações de status
- [x] F6 Testes de componente dos fluxos principais

### Fechamento
- [x] D1 Instruções de execução no README, `.env.example` da api e do web
- [x] D2 Verificação manual de ponta a ponta (cadastro → produto → pedido público → estoque baixa)
