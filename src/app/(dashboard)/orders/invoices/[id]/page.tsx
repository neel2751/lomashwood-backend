

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Invoice Detail Page — ID: {params.id}</h1>
      <p>Folder: src/app/(dashboard)/orders/invoices/[id]/</p>
    </div>
  );
}