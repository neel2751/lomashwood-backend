"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, Wrench, Users } from "lucide-react";

import { getTodayHours } from "@/lib/showroom-hours";

import type { Showroom } from "@/types/showroom.types";

interface ShowroomCardProps {
  showroom: Showroom;
}

export function ShowroomCard({ showroom }: ShowroomCardProps) {
  const todayHours = getTodayHours(showroom.openingHours) ?? showroom.openToday;

  return (
    <Link
      href={`/showrooms/${showroom.id}`}
      className="group block rounded-[16px] bg-[#1C1611] border border-[#2E231A] hover:border-[#C8924A]/30 transition-all overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 bg-[#0F0A06] overflow-hidden">
        {showroom.image ? (
          <Image
            src={showroom.image}
            alt={showroom.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-[#5A4232]" />
          </div>
        )}
        
        {/* Open Today Badge */}
        {todayHours && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-emerald-400/90 backdrop-blur-sm">
            <span className="text-xs font-medium text-[#0F0A06]">Open Today</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-[#F5F1E8] group-hover:text-[#C8924A] transition-colors mb-1">
            {showroom.name}
          </h3>
          <p className="text-sm text-[#5A4232]">{showroom.city}</p>
        </div>

        {/* Address & Contact */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#5A4232] shrink-0 mt-0.5" />
            <p className="text-sm text-[#8F7553] line-clamp-2">
              {showroom.address}, {showroom.postcode}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#5A4232] shrink-0" />
            <p className="text-sm text-[#8F7553]">{showroom.phone}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#5A4232] shrink-0" />
            <p className="text-sm text-[#8F7553] truncate">{showroom.email}</p>
          </div>
        </div>

        {/* Opening Hours */}
        {todayHours && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#2E231A]">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">{todayHours}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-[#2E231A]">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-[#C8924A]" />
            <span className="text-xs text-[#8F7553]">
              {showroom.displayProducts.length} displays
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#C8924A]" />
            <span className="text-xs text-[#8F7553]">
              {showroom.team.length} team members
            </span>
          </div>
        </div>

        {/* Facilities Preview */}
        {showroom.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {showroom.facilities.slice(0, 3).map((facility) => (
              <span
                key={facility}
                className="px-2 py-0.5 rounded-md bg-[#2E231A] text-xs text-[#8F7553]"
              >
                {facility}
              </span>
            ))}
            {showroom.facilities.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-[#5A4232]">
                +{showroom.facilities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
