"""Validation errors in the shape the web app expects: {"message": ..., "errors": {field: [msg]}}."""

import re
from typing import Any

from pydantic import BaseModel, ValidationError, model_validator
from pydantic_core import ErrorDetails

from app.i18n import get_locale, t

_MESSAGES: dict[str, dict[str, str]] = {
    "en": {
        "required": "The :attribute field is required.",
        "string": "The :attribute field must be a string.",
        "email": "The :attribute field must be a valid email address.",
        "integer": "The :attribute field must be an integer.",
        "boolean": "The :attribute field must be true or false.",
        "array": "The :attribute field must be an array.",
        "url": "The :attribute field must be a valid URL.",
        "in": "The selected :attribute is invalid.",
        "not_in": "The selected :attribute is invalid.",
        "unique": "The :attribute has already been taken.",
        "invalid": "The :attribute field is invalid.",
        "between": "The :attribute field must be between :min and :max.",
        "max.string": "The :attribute field must not be greater than :max characters.",
        "max.numeric": "The :attribute field must not be greater than :max.",
        "max.array": "The :attribute field must not have more than :max items.",
        "min.string": "The :attribute field must be at least :min characters.",
        "min.numeric": "The :attribute field must be at least :min.",
        "min.array": "The :attribute field must have at least :min items.",
    },
    "pt_BR": {
        "required": "O campo :attribute é obrigatório.",
        "string": "O campo :attribute deve ser um texto.",
        "email": "O campo :attribute deve ser um e-mail válido.",
        "integer": "O campo :attribute deve ser um número inteiro.",
        "boolean": "O campo :attribute deve ser verdadeiro ou falso.",
        "array": "O campo :attribute deve ser uma lista.",
        "url": "O campo :attribute deve ser uma URL válida.",
        "in": "O valor selecionado para :attribute é inválido.",
        "not_in": "O valor selecionado para :attribute é inválido.",
        "unique": "Este valor de :attribute já está em uso.",
        "invalid": "O campo :attribute é inválido.",
        "between": "O campo :attribute deve estar entre :min e :max.",
        "max.string": "O campo :attribute não pode ter mais de :max caracteres.",
        "max.numeric": "O campo :attribute não pode ser maior que :max.",
        "max.array": "O campo :attribute não pode ter mais de :max itens.",
        "min.string": "O campo :attribute deve ter pelo menos :min caracteres.",
        "min.numeric": "O campo :attribute deve ser pelo menos :min.",
        "min.array": "O campo :attribute deve ter pelo menos :min itens.",
    },
}

_ATTRIBUTES_PT_BR = {
    "name": "nome",
    "email": "e-mail",
    "password": "senha",
    "shop_name": "nome da loja",
    "phone": "telefone",
    "description": "descrição",
    "price_cents": "preço",
    "stock": "estoque",
    "low_stock_threshold": "limite de estoque baixo",
    "category_id": "categoria",
    "active": "ativo",
    "image_url": "imagem",
    "delta": "quantidade",
    "reason": "motivo",
    "status": "status",
    "customer_name": "nome do cliente",
    "customer_phone": "telefone do cliente",
    "fulfillment": "forma de recebimento",
    "address": "endereço",
    "notes": "observações",
    "items": "itens",
    "items.*.product_id": "produto",
    "items.*.quantity": "quantidade",
}


class ValidationFailed(Exception):
    """Raised by request parsing and by services; rendered as HTTP 422."""

    def __init__(self, errors: dict[str, list[str]]) -> None:
        super().__init__("validation failed")
        self.errors = errors

    @classmethod
    def single(cls, field: str, message: str) -> "ValidationFailed":
        return cls({field: [message]})

    def message(self) -> str:
        flat = [m for messages in self.errors.values() for m in messages]
        if not flat:
            return t("The given data was invalid.")
        extra = len(flat) - 1
        if extra == 0:
            return flat[0]
        key = "(and :count more error)" if extra == 1 else "(and :count more errors)"
        return f"{flat[0]} {t(key, count=extra)}"


def attribute_name(field: str) -> str:
    if get_locale() == "pt_BR":
        return _ATTRIBUTES_PT_BR.get(re.sub(r"\.\d+(?=\.|$)", ".*", field), field)
    return field.replace("_", " ")


def rule_message(rule: str, field: str, **params: Any) -> str:
    text = _MESSAGES.get(get_locale(), _MESSAGES["en"])[rule]
    params["attribute"] = attribute_name(field)
    for name, value in params.items():
        text = text.replace(f":{name}", str(value))
    return text


def _rule_for(err: ErrorDetails) -> tuple[str, dict[str, Any]]:
    kind, ctx, given = err["type"], err.get("ctx") or {}, err.get("input")
    if kind == "missing" or (given is None and kind.endswith(("_type", "_parsing", "_error"))):
        return "required", {}
    match kind:
        case "string_type":
            return "string", {}
        case "int_type" | "int_parsing" | "int_from_float" | "int_parsing_size":
            return "integer", {}
        case "bool_type" | "bool_parsing":
            return "boolean", {}
        case "list_type":
            return "array", {}
        case "literal_error" | "enum":
            return "in", {}
        case "string_too_long":
            return "max.string", {"max": ctx["max_length"]}
        case "string_too_short":
            return "min.string", {"min": ctx["min_length"]}
        case "greater_than_equal":
            return "min.numeric", {"min": ctx["ge"]}
        case "less_than_equal":
            return "max.numeric", {"max": ctx["le"]}
        case "too_long":
            return "max.array", {"max": ctx["max_length"]}
        case "too_short":
            return ("required", {}) if ctx["min_length"] == 1 else ("min.array", {"min": ctx["min_length"]})
        case "email" | "url" | "not_in" | "between":
            return kind, ctx
    return "invalid", {}


def from_pydantic(exc: ValidationError) -> ValidationFailed:
    return from_error_details(exc.errors())


def from_error_details(details: list[ErrorDetails] | Any) -> ValidationFailed:
    errors: dict[str, list[str]] = {}
    for err in details:
        field = ".".join(str(part) for part in err["loc"] if part != "body")
        rule, params = _rule_for(err)
        errors.setdefault(field, []).append(rule_message(rule, field, **params))
    return ValidationFailed(errors)


def _clean(value: Any, key: str | None = None) -> Any:
    """Trim strings and turn empty ones into null, like the web client expects."""
    if isinstance(value, str):
        text = value if key == "password" else value.strip()
        return text or None
    if isinstance(value, list):
        return [_clean(v) for v in value]
    if isinstance(value, dict):
        return {k: _clean(v, k) for k, v in value.items()}
    return value


class RequestModel(BaseModel):
    """Base class of request bodies: trims strings and maps "" to null before validating."""

    @model_validator(mode="before")
    @classmethod
    def _trim(cls, data: Any) -> Any:
        return _clean(data) if isinstance(data, dict) else data
