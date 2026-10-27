"""Acceso a SQL Server para los indicadores transversales del backend analítico.

La conexión es opcional: si `pyodbc` o el driver ODBC no están disponibles, los
repositorios degradan a datos de respaldo para que la API siga respondiendo.
"""

import asyncio
import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Sequence

from app.config.settings import settings

logger = logging.getLogger("uvicorn")

try:
    import pyodbc

    PYODBC_AVAILABLE = True
except Exception:  # pragma: no cover - depende del entorno de despliegue
    pyodbc = None
    PYODBC_AVAILABLE = False


class SQLServerUnavailable(RuntimeError):
    """Se lanza cuando SQL Server no está configurado o no es accesible."""


def is_sqlserver_available() -> bool:
    return bool(settings.SQLSERVER_ENABLED and PYODBC_AVAILABLE)


def _connection_string() -> str:
    return (
        f"DRIVER={{{settings.SQLSERVER_DRIVER}}};"
        f"SERVER={settings.SQLSERVER_HOST},{settings.SQLSERVER_PORT};"
        f"DATABASE={settings.SQLSERVER_DATABASE};"
        f"UID={settings.SQLSERVER_USER};"
        f"PWD={settings.SQLSERVER_PASSWORD};"
        "TrustServerCertificate=yes;Encrypt=no;"
    )


def _serialize(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def _fetch_all_sync(query: str, params: Sequence[Any]) -> List[Dict[str, Any]]:
    if not settings.SQLSERVER_ENABLED:
        raise SQLServerUnavailable("SQL Server deshabilitado (SQLSERVER_ENABLED=false).")
    if not PYODBC_AVAILABLE:
        raise SQLServerUnavailable("El paquete pyodbc no está instalado.")

    with pyodbc.connect(
        _connection_string(),
        timeout=settings.SQLSERVER_TIMEOUT,
    ) as connection:
        cursor = connection.cursor()
        cursor.execute(query, tuple(params))
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

    return [
        {column: _serialize(value) for column, value in zip(columns, row)}
        for row in rows
    ]


async def fetch_all(query: str, params: Optional[Sequence[Any]] = None) -> List[Dict[str, Any]]:
    """Ejecuta una consulta de lectura sin bloquear el event loop."""
    return await asyncio.to_thread(_fetch_all_sync, query, params or ())
