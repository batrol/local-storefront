# api

API REST em Laravel 13 (PHP 8.5). Três camadas: Controller → Service → Repository.
Mensagens de validação e de erro em português do Brasil (`lang/pt_BR`).

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan serve          # http://127.0.0.1:8000
php artisan test           # testes (SQLite em memória)
vendor/bin/pint --test     # formatação
vendor/bin/phpstan analyse # análise estática, nível 6
```
