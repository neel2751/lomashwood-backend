"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  Navigation,
  Users,
  Wrench,
  CheckCircle2,
  Store,
  Calendar,
} from "lucide-react";

import { formatDayLabel, getTodayHours, sortOpeningHoursFromToday } from "@/lib/showroom-hours";

import type { Showroom } from "@/types/showroom.types";

interface ShowroomDetailsProps {
  showroom: Showroom;
}

export function ShowroomDetails({ showroom }: ShowroomDetailsProps) {
  const orderedOpeningHours = sortOpeningHoursFromToday(showroom.openingHours);
  const todayHours = getTodayHours(showroom.openingHours) ?? showroom.openToday;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/showrooms"
          className="inline-flex items-center gap-2 text-sm text-[#8F7553] hover:text-[#C8924A] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to showrooms
        </Link>
        <Link
          href={`/showrooms/${showroom.id}/edit`}
          className="px-4 py-2 rounded-[10px] bg-[#C8924A] hover:bg-[#B07F3F] text-white text-sm font-medium transition-colors"
        >
          Edit showroom
        </Link>
      </div>

      {/* Header Image */}
      <div className="relative h-[300px] rounded-[16px] overflow-hidden bg-[#0F0A06] border border-[#2E231A]">
        {showroom.image ? (
          <Image
            src={showroom.image}
            alt={showroom.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-16 h-16 text-[#5A4232]" />
          </div>
        )}
        
        {todayHours && (
          <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-emerald-400/90 backdrop-blur-sm">
            <span className="text-sm font-medium text-[#0F0A06]">
              Open Today: {todayHours}
            </span>
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-6">
        {/* Title & City */}
        <div>
          <h1 className="text-3xl font-bold text-[#F5F1E8] mb-2">{showroom.name}</h1>
          <p className="text-lg text-[#C8924A]">{showroom.city}</p>
        </div>

        {/* Contact & Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#2E231A]">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#F5F1E8] uppercase tracking-wide">
              Contact Information
            </h3>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#C8924A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#F5F1E8]">{showroom.address}</p>
                <p className="text-sm text-[#8F7553]">{showroom.postcode}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#C8924A] shrink-0" />
              <a
                href={`tel:${showroom.phone}`}
                className="text-sm text-[#F5F1E8] hover:text-[#C8924A] transition-colors"
              >
                {showroom.phone}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#C8924A] shrink-0" />
              <a
                href={`mailto:${showroom.email}`}
                className="text-sm text-[#F5F1E8] hover:text-[#C8924A] transition-colors"
              >
                {showroom.email}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-[#C8924A] shrink-0" />
              <a
                href={`https://maps.google.com/?q=${showroom.latitude},${showroom.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#F5F1E8] hover:text-[#C8924A] transition-colors"
              >
                Get Directions
              </a>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#F5F1E8] uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C8924A]" />
              Opening Hours
            </h3>
            
            <div className="space-y-2">
              {orderedOpeningHours.map((hour, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <span className="text-[#8F7553]">{formatDayLabel(hour.day)}</span>
                  <span className="text-[#F5F1E8] font-medium">{hour.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Facilities */}
      {showroom.facilities.length > 0 && (
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#F5F1E8] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#C8924A]" />
            Facilities & Services
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {showroom.facilities.map((facility) => (
              <div
                key={facility}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-[#F5F1E8]">{facility}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {showroom.team.length > 0 && (
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#F5F1E8] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C8924A]" />
            Our Team
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showroom.team.map((member, idx) => (
              <div
                key={idx}
                className="p-4 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E] space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white font-bold">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-[#F5F1E8]">{member.name}</p>
                  <p className="text-sm text-[#8F7553]">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Displays on Showroom */}
      {showroom.displayProducts.length > 0 && (
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#F5F1E8] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#C8924A]" />
            Kitchens & Bedrooms on Display
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showroom.displayProducts.map((entry) => (
              <div
                key={entry.id || entry.productId}
                className="rounded-[10px] overflow-hidden bg-[#2E231A] border border-[#3D2E1E] hover:border-[#C8924A]/30 transition-colors"
              >
                <div className="relative h-40 bg-[#0F0A06]">
                  {entry.product?.image ? (
                    <Image
                      src={entry.product.image}
                      alt={entry.product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Wrench className="w-8 h-8 text-[#5A4232]" />
                    </div>
                  )}
                  {entry.isPrimary && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-[#C8924A] text-xs font-medium text-white">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-medium text-[#F5F1E8]">{entry.product?.title || entry.productId}</h4>
                  <p className="text-sm text-[#8F7553] capitalize">{entry.product?.category || "product"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Stores */}
      {showroom.nearbyStores.length > 0 && (
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#F5F1E8] flex items-center gap-2">
            <Store className="w-5 h-5 text-[#C8924A]" />
            Nearby Stores
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {showroom.nearbyStores.map((store) => (
              <div
                key={store}
                className="px-3 py-2 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E] text-sm text-[#F5F1E8]"
              >
                {store}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6">
        <div className="flex items-center gap-6 text-xs text-[#5A4232]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created: {new Date(showroom.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Updated: {new Date(showroom.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
