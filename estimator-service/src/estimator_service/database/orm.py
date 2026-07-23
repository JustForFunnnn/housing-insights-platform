from sqlalchemy import BigInteger, CheckConstraint, Float, Index, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class EstimateRow(Base):
    """Single schema definition for persisted estimates."""

    __tablename__ = "estimates"
    __table_args__ = (
        CheckConstraint(
            "estimated_price >= 0",
            name="ck_estimates_estimated_price_nonnegative",
        ),
    )

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


Index(
    "idx_estimates_created_at_id",
    EstimateRow.created_at.desc(),
    EstimateRow.id.desc(),
)
