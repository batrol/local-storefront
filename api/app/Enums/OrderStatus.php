<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Ready = 'ready';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'novo',
            self::Confirmed => 'confirmado',
            self::Ready => 'pronto',
            self::Completed => 'concluído',
            self::Cancelled => 'cancelado',
        };
    }

    /** @return list<self> */
    public function next(): array
    {
        return match ($this) {
            self::Pending => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::Ready, self::Cancelled],
            self::Ready => [self::Completed, self::Cancelled],
            self::Completed, self::Cancelled => [],
        };
    }

    public function canBecome(self $target): bool
    {
        return in_array($target, $this->next(), true);
    }
}
