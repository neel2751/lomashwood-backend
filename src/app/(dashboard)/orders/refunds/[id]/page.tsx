
export default function RefundDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Refund Detail Page — ID: {params.id}</h1>
      <p>Folder: src/app/(dashboard)/orders/refunds/[id]/</p>
    </div>
  );
}