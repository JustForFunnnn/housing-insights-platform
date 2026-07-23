from sqlalchemy import BigInteger, Float, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class EstimateRow(Base):
    """ORM mapping for the externally managed estimates table."""

    __tablename__ = "estimates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    square_footage: Mapped[float] = mapped_column(Float)
    bedrooms: Mapped[int] = mapped_column(Integer)
    bathrooms: Mapped[float] = mapped_column(Float)
    year_built: Mapped[int] = mapped_column(Integer)
    lot_size: Mapped[float] = mapped_column(Float)
    distance_to_city_center: Mapped[float] = mapped_column(Float)
    school_rating: Mapped[float] = mapped_column(Float)
    estimated_price: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[str] = mapped_column(String)
