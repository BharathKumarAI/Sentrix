"""Create an empty PostgreSQL database schema from the canonical ORM metadata."""
import argparse
from sqlalchemy.schema import CreateSchema, CreateTable, CreateIndex
from sqlalchemy.dialects import postgresql
from backend.database.connection import Base, sync_engine
from backend.database import models  # noqa: F401


def schema_sql():
    dialect = postgresql.dialect()
    statements = [str(CreateSchema(s, if_not_exists=True).compile(dialect=dialect))
                  for s in sorted({t.schema for t in Base.metadata.tables.values() if t.schema})]
    for table in Base.metadata.sorted_tables:
        statements.append(str(CreateTable(table, if_not_exists=True).compile(dialect=dialect)))
        statements.extend(str(CreateIndex(i, if_not_exists=True).compile(dialect=dialect))
                          for i in sorted(table.indexes, key=lambda i: i.name))
    return ";\n\n".join(statements) + ";\n"


def create_schema():
    # No drop/reset or data insertion: point this command at a fresh database.
    with sync_engine.begin() as connection:
        for schema in sorted({t.schema for t in Base.metadata.tables.values() if t.schema}):
            connection.execute(CreateSchema(schema, if_not_exists=True))
        Base.metadata.create_all(connection)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sql", action="store_true", help="Print DDL without connecting to the database")
    args = parser.parse_args()
    if args.sql:
        print(schema_sql())
    else:
        create_schema()
