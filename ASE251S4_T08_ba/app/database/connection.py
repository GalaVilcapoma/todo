import logging

from motor.motor_asyncio import AsyncIOMotorClient

from app.config.settings import settings

logger = logging.getLogger("uvicorn")


class DatabaseManager:
    client: AsyncIOMotorClient | None = None
    db = None


db_manager = DatabaseManager()


async def connect_to_mongo() -> None:
    """Conecta al cluster MongoDB y verifica disponibilidad con un ping."""
    logger.info("Conectando al backend analítico (MongoDB)...")
    db_manager.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    await db_manager.client.admin.command("ping")
    db_manager.db = db_manager.client[settings.DATABASE_NAME]
    logger.info("Conexión exitosa a la base de datos MongoDB: %s", settings.DATABASE_NAME)


async def close_mongo_connection() -> None:
    """Cierra la conexión activa con MongoDB."""
    if db_manager.client is not None:
        db_manager.client.close()
        db_manager.client = None
        db_manager.db = None
        logger.info("Conexión con MongoDB cerrada correctamente.")


def get_database():
    """Devuelve la base de datos activa (usada por la capa de repositorios)."""
    return db_manager.db