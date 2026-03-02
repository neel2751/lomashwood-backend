"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  Calendar,
  Users,
  Star,
  Filter,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const MOCK_CONSULTANTS = [
  {
    id: "c1",
    name: "James Harrington",
    email: "james.h@lomashwood.co.uk",
    phone: "+44 7700 900001",
    avatar: "",
    speciality: ["Kitchen", "Bedroom"],
    status: "active",
    appointmentsThisMonth: 18,
    rating: 4.9,
    availability: "Mon–Fri",
    joinedAt: "Jan 2023",
  },
  {
    id: "c2",
    name: "Sophie Clarke",
    email: "sophie.c@lomashwood.co.uk",
    phone: "+44 7700 900002",
    avatar: "",
    speciality: ["Kitchen"],
    status: "active",
    appointmentsThisMonth: 12,
    rating: 4.7,
    availability: "Mon–Sat",
    joinedAt: "Mar 2023",
  },
  {
    id: "c3",
    name: "Daniel Webb",
    email: "daniel.w@lomashwood.co.uk",
    phone: "+44 7700 900003",
    avatar: "",
    speciality: ["Bedroom"],
    status: "inactive",
    appointmentsThisMonth: 0,
    rating: 4.5,
    availability: "Tue–Sat",
    joinedAt: "Jun 2022",
  },
  {
    id: "c4",
    name: "Priya Mehta",
    email: "priya.m@lomashwood.co.uk",
    phone: "+44 7700 900004",
    avatar: "",
    speciality: ["Kitchen", "Bedroom"],
    status: "active",
    appointmentsThisMonth: 22,
    rating: 5.0,
    availability: "Mon–Fri",
    joinedAt: "Sep 2021",
  },
  {
    id: "c5",
    name: "Tom Fielding",
    email: "tom.f@lomashwood.co.uk",
    phone: "+44 7700 900005",
    avatar: "",
    speciality: ["Kitchen"],
    status: "active",
    appointmentsThisMonth: 9,
    rating: 4.6,
    availability: "Wed–Sun",
    joinedAt: "Feb 2024",
  },
];

const STATS = [
  { label: "Total Consultants", value: "5", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Active", value: "4", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { label: "Appts This Month", value: "61", icon: Calendar, color: "text-violet-600 bg-violet-50" },
  { label: "Avg Rating", value: "4.7", icon: Star, color: "text-amber-600 bg-amber-50" },
];

const specialityColors: Record<string, string> = {
  Kitchen: "bg-orange-100 text-orange-700 border-orange-200",
  Bedroom: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function ConsultantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialityFilter, setSpecialityFilter] = useState("all");

  const filtered = MOCK_CONSULTANTS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSpeciality =
      specialityFilter === "all" || c.speciality.includes(specialityFilter);
    return matchesSearch && matchesStatus && matchesSpeciality;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Consultants
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage appointment consultants for Kitchen &amp; Bedroom services.
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/consultants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Consultant
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`rounded-lg p-2 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-semibold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={specialityFilter} onValueChange={setSpecialityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Speciality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialities</SelectItem>
            <SelectItem value="Kitchen">Kitchen</SelectItem>
            <SelectItem value="Bedroom">Bedroom</SelectItem>
          </SelectContent>
        </Select>

        <p className="ml-auto text-sm text-gray-500">
          {filtered.length} consultant{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Card className="border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60">
              <TableHead className="w-[260px]">Consultant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Speciality</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-center">Appts / Month</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  No consultants match your filters.
                </TableCell>
              </TableRow>
            )}

            {filtered.map((consultant) => (
              <TableRow key={consultant.id} className="group hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={consultant.avatar} />
                      <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-600">
                        {getInitials(consultant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{consultant.name}</p>
                      <p className="text-xs text-gray-400">Since {consultant.joinedAt}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail className="h-3 w-3 text-gray-400" />
                      {consultant.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {consultant.phone}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {consultant.speciality.map((s) => (
                      <span
                        key={s}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${specialityColors[s]}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {consultant.availability}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="text-sm font-semibold text-gray-800">
                    {consultant.appointmentsThisMonth}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {consultant.rating.toFixed(1)}
                  </span>
                </TableCell>

                <TableCell>
                  {consultant.status === "active" ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500">
                      <XCircle className="mr-1 h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/appointments/consultants/${consultant.id}`}>
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/appointments/consultants/${consultant.id}/edit`}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}