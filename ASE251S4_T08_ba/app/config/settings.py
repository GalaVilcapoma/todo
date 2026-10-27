from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Backend Analítico ASE251S4_T08_ba"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    PORT: int = 8000

    MONGODB_URI: str = "mongodb://localhost:27017/db_agrochemicals"
    DATABASE_NAME: str = "db_agrochemicals"

    # SQL Server (indicadores transversales MongoDB + SQL Server)
    SQLSERVER_ENABLED: bool = True
    SQLSERVER_HOST: str = "localhost"
    SQLSERVER_PORT: int = 1433
    SQLSERVER_DATABASE: str = "avsa_db"
    SQLSERVER_USER: str = "sa"
    SQLSERVER_PASSWORD: str = ""
    SQLSERVER_DRIVER: str = "ODBC Driver 18 for SQL Server"
    SQLSERVER_TIMEOUT: int = 5
    SQLSERVER_ORDERS_TABLE: str = "customer_orders_s4"
    SQLSERVER_MOVEMENTS_TABLE: str = "product_stock_movements"

    CORS_ORIGINS: list[str] = ["*"]


settings = Settings()