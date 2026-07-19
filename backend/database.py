import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite is the default so the whole thing runs out of the box with zero setup —
# point DATABASE_URL at Postgres/MySQL in production if you outgrow a single file.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartcourt.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that hands out a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
