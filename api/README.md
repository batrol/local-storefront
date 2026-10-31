# api

🇺🇸 English · [🇧🇷 Português (Brasil)](README.pt-BR.md)

Laravel 13 REST API (PHP 8.5). Three layers: Controller → Service → Repository.

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan serve          # http://127.0.0.1:8000
php artisan test           # test suite (SQLite in memory)
vendor/bin/pint --test     # formatting
vendor/bin/phpstan analyse # static analysis, level 6
```
