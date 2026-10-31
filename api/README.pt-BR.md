# api

[🇺🇸 English](README.md) · 🇧🇷 Português (Brasil)

API REST em Laravel 13 (PHP 8.5). Três camadas: Controller → Service → Repository.
Mensagens em inglês por padrão; em português do Brasil quando o cabeçalho `Accept-Language` pede `pt-BR`.

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan serve          # http://127.0.0.1:8000
php artisan test           # testes (SQLite em memória)
vendor/bin/pint --test     # formatação
vendor/bin/phpstan analyse # análise estática, nível 6
```
