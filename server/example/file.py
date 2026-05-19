from sqlalchemy import MetaData, create_engine, Table, Column, Integer, String
from src.config.settings import settings

engine = create_engine(url=settings.DATABASE_URL)

meta = MetaData()

my_table = Table(
    "my_table",
    meta,
    Column("id", Integer, primary_key=True),
    Column("name", String(45))
)

meta.create_all(engine)