from enum import StrEnum

from app.i18n import t


class OrderStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

    def label(self) -> str:
        return t(_LABEL_KEYS[self])

    def next(self) -> list["OrderStatus"]:
        return _TRANSITIONS[self]

    def can_become(self, target: "OrderStatus") -> bool:
        return target in self.next()


# Translation keys of the status labels (English uses the key itself).
_LABEL_KEYS = {
    OrderStatus.PENDING: "new",
    OrderStatus.CONFIRMED: "confirmed",
    OrderStatus.READY: "ready",
    OrderStatus.COMPLETED: "completed",
    OrderStatus.CANCELLED: "cancelled",
}

_TRANSITIONS = {
    OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    OrderStatus.COMPLETED: [],
    OrderStatus.CANCELLED: [],
}
