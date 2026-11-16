from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import Settings
from app.db import make_engine, make_session_factory
from app.deps import new_rate_hits
from app.errors import ApiError
from app.i18n import LocaleMiddleware, t
from app.routers import auth, categories, orders, products, public_shop
from app.validation import ValidationFailed, from_error_details


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    engine = make_engine(settings.database_url)

    app = FastAPI(
        title=settings.app_name, docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None
    )
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = make_session_factory(engine)
    app.state.rate_hits = new_rate_hits()

    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    app.add_middleware(LocaleMiddleware, default=settings.app_locale)

    @app.exception_handler(ValidationFailed)
    async def _validation_failed(_: Request, exc: ValidationFailed) -> JSONResponse:
        return JSONResponse({"message": exc.message(), "errors": exc.errors}, status_code=422)

    @app.exception_handler(RequestValidationError)
    async def _request_invalid(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = exc.errors()
        if any(err["loc"][0] in ("path", "query") for err in details):
            return JSONResponse({"message": t("Not found.")}, status_code=404)
        return await _validation_failed(_, from_error_details(details))

    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse({"message": t(exc.message)}, status_code=exc.status_code)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = t("Not found.") if exc.status_code == 404 else str(exc.detail)
        return JSONResponse({"message": message}, status_code=exc.status_code)

    @app.get("/up", include_in_schema=False)
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth.router, prefix="/api")
    app.include_router(auth.me_router, prefix="/api")
    app.include_router(categories.router, prefix="/api")
    app.include_router(products.router, prefix="/api")
    app.include_router(orders.router, prefix="/api")
    app.include_router(public_shop.router, prefix="/api")
    return app


app = create_app()
