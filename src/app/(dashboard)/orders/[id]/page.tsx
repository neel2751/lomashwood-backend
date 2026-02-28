

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Order Detail Page — ID: {params.id}</h1>
      <p>Folder: src/app/(dashboard)/orders/[id]/</p>
    </div>
  );
}