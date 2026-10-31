# local-storefront

Um app que leva o e-commerce para os pequenos comerciantes de uma cidade, coordena a
entrega e oferece um serviço de compras para os clientes.

> **Status: MVP em andamento.** O desenho começou em 24/08/2026 (primeiro diagrama em [`docs/`](docs/)).
> O código segue o [`ROADMAP.md`](ROADMAP.md) e o [`PLAN_MVP.md`](PLAN_MVP.md). Nada é dado como
> pronto até estar marcado lá.

## A ideia

Disponível como **app mobile e na web**, com o mesmo backend e os mesmos dados.

Três serviços em um só app, focados em uma cidade e em suporte local próximo:

1. **E-commerce para pequenos comerciantes.** Cada loja tem catálogo, controle de estoque,
   gestão de pedidos e um link de pedido para compartilhar, sem precisar de loja virtual
   própria. O estoque é mantido pelo app ou pelo painel web: entradas, saídas, ajustes e
   contagens.
2. **Entrega coordenada pelo app.** Os pedidos são despachados para entregadores locais, com
   atribuição, acompanhamento de status e confirmação de entrega.
3. **Serviço de compras para o cliente.** O cliente pede itens (de uma ou várias lojas) e um
   comprador faz a compra e entrega.

## Para quem é

- **Comerciantes** da cidade: vendem online e gerenciam estoque e pedidos.
- **Clientes:** pedem de lojas locais, acompanham a entrega ou pedem para alguém comprar por eles.
- **Entregadores / compradores:** recebem e concluem entregas e pedidos de compra.
- **Operador da plataforma:** cadastra os comerciantes e dá suporte direto a eles.

## Módulos planejados

Catálogo · Estoque · Pedidos · Coordenação de entregas · Pedidos de compra · Clientes · Admin,
além de autenticação, notificações, histórico de auditoria e relatórios. A ordem de entrega
(MVP primeiro, depois as versões) está no [`ROADMAP.md`](ROADMAP.md).

## Tecnologias

- `api/`: Laravel 13 (PHP 8.5), autenticação por token com Sanctum, SQLite em desenvolvimento
  e testes, três camadas (Controller → Service → Repository). PHPUnit, Pint e Larastan.
- `web/`: React 19, Vite, TypeScript, Tailwind 4, TanStack Query, react-hook-form + zod,
  React Router, Vitest + Testing Library.
- Mobile: o app web será empacotado com Capacitor depois que as telas do MVP estiverem prontas.

## Como rodar

API (precisa de PHP 8.5 e Composer):

```sh
cd api
cp .env.example .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve            # http://127.0.0.1:8000
php artisan test             # PHPUnit
```

Web (precisa de Node 22+):

```sh
cd web
cp .env.example .env         # opcional: VITE_API_URL fica vazio em dev, o Vite faz proxy de /api
npm install
npm run dev                  # http://localhost:8080
npm test                     # Vitest
```

Abra `/cadastro` para criar um comerciante e a loja; a vitrine pública fica em `/loja/<slug-da-loja>`.
Nunca versione segredos reais: os arquivos `.env` são ignorados pelo Git.

## Dados

Este repositório usa apenas dados de exemplo inventados. Nenhum dado real de comerciantes,
clientes ou entregadores.

## Licença

[MIT](LICENSE) © 2026 Plínio Almeida
