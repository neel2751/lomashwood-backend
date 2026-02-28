

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Payment Detail Page — ID: {params.id}</h1>
      <p>Folder: src/app/(dashboard)/orders/payments/[id]/</p>
    </div>
  );
}