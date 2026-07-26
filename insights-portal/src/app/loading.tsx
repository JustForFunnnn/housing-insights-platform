export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading application">
      <div className="skeleton" style={{ minHeight: 180 }} />
      <div
        className="parcel-grid"
        style={{ marginTop: 24 }}
        aria-hidden="true"
      >
        <div className="parcel parcel-span-6 skeleton" />
        <div className="parcel parcel-span-6 skeleton" />
      </div>
    </div>
  );
}
