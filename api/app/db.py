from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(url: str) -> Engine:
    kwargs: dict[str, Any] = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if url in ("sqlite://", "sqlite:///:memory:"):
            kwargs["poolclass"] = StaticPool

    engine = create_engine(url, **kwargs)

    if url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _enable_foreign_keys(dbapi_connection: Any, _record: Any) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, expire_on_commit=False)


@contextmanager
def transaction(db: Session) -> Iterator[None]:
    """Commit when the outermost block succeeds, roll back when any block fails.

    Nested blocks join the outer one, so a service can call another service and the
    whole use case is still a single transaction.
    """
    depth = db.info.get("tx_depth", 0)
    db.info["tx_depth"] = depth + 1
    try:
        yield
        if depth == 0:
            db.commit()
    except BaseException:
        if depth == 0:
            db.rollback()
        raise
    finally:
        db.info["tx_depth"] = depth
