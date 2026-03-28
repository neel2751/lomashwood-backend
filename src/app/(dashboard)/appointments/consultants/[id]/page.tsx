"use client";

import Link from "next/link";

import { Loader2, Mail, Phone, Clock, Calendar, Pencil, CheckCircle2, XCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConsultant } from "@/hooks/useConsultants";

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ConsultantDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useConsultant(params.id);
  const consultant = data as any;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Consultant Details"
        description="View consultant profile and recent appointment activity."
        backHref="/appointments/consultants"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading consultant…</span>
        </div>
      ) : isError || !consultant ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-600">Failed to load consultant.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Profile</CardTitle>
              <Button asChild size="sm">
                <Link href={`/appointments/consultants/${consultant.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={consultant.avatar} />
                  <AvatarFallback>{getInitials(consultant.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-gray-900">{consultant.name}</p>
                  <p className="text-xs text-gray-500">Since {formatDate(consultant.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-white p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Email</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-800">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {consultant.email}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Phone</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-800">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {consultant.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Speciality</p>
                <div className="flex flex-wrap gap-1.5">
                  {(consultant.speciality ?? []).map((item: string) => (
                    <Badge key={item} variant="outline" className="bg-gray-50 text-gray-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Notes</p>
                <p className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
                  {consultant.notes || "No notes added."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultant.status === "active" ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactive
                  </Badge>
                )}

                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {consultant.availability || "Availability not set"}
                </p>

                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Updated {formatDate(consultant.updatedAt)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(consultant.appointments ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No appointments yet.</p>
                ) : (
                  consultant.appointments.map((item: any) => (
                    <div key={item.id} className="rounded-lg border bg-gray-50 p-2.5">
                      <p className="text-sm font-medium text-gray-800">{item.customerName}</p>
                      <p className="text-xs text-gray-500">
                        {item.type} · {item.status}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
