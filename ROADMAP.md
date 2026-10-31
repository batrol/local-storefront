# Roadmap

Marque um item só quando ele estiver integrado e funcionando. Começamos pela menor fatia que
funciona de ponta a ponta e acrescentamos um dos três serviços a cada versão.

## MVP (v0.1): um comerciante vende por um link
- [x] Escolher e documentar as tecnologias; esqueletos da API e do web, lint, testes, CI (falta o empacotamento mobile)
- [x] Login do comerciante (um único perfil)
- [ ] Produtos e categorias (nome, preço, foto, descrição)
- [x] Página pública de catálogo por comerciante na web (link compartilhável)
- [ ] Painel web do comerciante e app mobile, ambos na mesma API
- [x] Carrinho e criação de pedido (nome e telefone do cliente, retirada ou entrega)
- [x] Lista de pedidos do comerciante com mudança de status
- [x] Estoque básico mantido no app: definir/ajustar quantidade por produto, baixa automática no pedido, aviso de estoque baixo

## v0.2: confiabilidade de estoque e pedidos
- [ ] Reserva de estoque no pedido, devolução no cancelamento, histórico de movimentações
- [ ] Máquina de estados completa do pedido e página de acompanhamento para o cliente
- [ ] Vendas em loja com baixa de estoque
- [ ] Manutenção de estoque pelo celular: entrada/saída rápida, ajuste com motivo, contagem de inventário
- [ ] Leitura de código de barras para achar um produto ou dar entrada no estoque
- [ ] Alertas de estoque baixo para o comerciante
- [ ] Notificação de pedido para o comerciante

## v0.3: entrega coordenada pelo app
- [ ] Perfil e cadastro do entregador (primeiro no app mobile)
- [ ] Solicitação de entrega criada a partir de um pedido (endereço de retirada, destino, taxa)
- [ ] Atribuição a um entregador (manual primeiro, depois automática)
- [ ] Fluxo de status da entrega: atribuída, coletada, a caminho, entregue
- [ ] Confirmação de entrega (código ou foto) e histórico do entregador

## v0.4: plataforma com vários comerciantes
- [ ] Vários comerciantes em uma mesma instalação, com dados isolados
- [ ] Painel do operador para cadastrar e dar suporte aos comerciantes
- [ ] Áreas de entrega, taxas e prazos
- [ ] Histórico de auditoria das ações

## v0.5: serviço de compras
- [ ] O cliente cria um pedido de compra (lista de itens, lojas, orçamento)
- [ ] O comprador aceita, compra e avisa sobre mudança de preço ou item em falta
- [ ] O cliente aprova substituições e o total final
- [ ] Entrega da compra reaproveitando o fluxo da v0.3

## Depois
- [ ] Pagamento online (PIX) e repasses
- [ ] Avaliações de comerciantes, entregadores e compradores
- [ ] Contas de cliente e histórico de pedidos
- [ ] Relatórios (vendas, estoque, entregas)
- [ ] Backups e revisão de segurança
