"use client";

import { useState } from 'react'

import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar'
import { useAppointments } from '@/hooks/useAppointments'

type AppointmentRecord = {
  id: string
  type: 'home' | 'online' | 'showroom'
  forKitchen: boolean
  forBedroom: boolean
  customerName: string
  customerEmail: string
  customerPhone: string
  postcode: string
  address: string
  slot: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  consultantId?: string
  consultantName?: string
  showroomId?: string
  showroomName?: string
  notes?: string
  confirmationEmailSentAt?: string
  reminderEmailSentAt?: string
  missedEmailSentAt?: string
  createdAt: string
  updatedAt: string
}

export function AppointmentCalendarView() {
  const [typeFilter, setTypeFilter] = useState<'All' | 'home' | 'online' | 'showroom'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'>('All')

  const appointmentsQuery = useAppointments({
    page: 1,
    limit: 200, // Max allowed by API
    type: typeFilter === 'All' ? undefined : typeFilter,
    status: statusFilter === 'All' ? undefined : statusFilter,
  })
  
  // Extract appointments from the response data
  const appointments = (() => {
    if (appointmentsQuery.isLoading || !appointmentsQuery.data) return []
    
    const data = appointmentsQuery.data as any
    
    // Check if data has a 'data' property (paginated response)
    if (data?.data && Array.isArray(data.data)) {
      return data.data as AppointmentRecord[]
    }
    
    // Check if data is already an array (direct array response)
    if (Array.isArray(data)) {
      return data as AppointmentRecord[]
    }
    
    return []
  })()

  return (
    <div className="calendar-view__container">
      {appointmentsQuery.isError && (
        <div className="error-message">
          <p>Failed to load appointments. {(appointmentsQuery.error as any)?.message}</p>
        </div>
      )}

      {appointmentsQuery.isLoading && (
        <div className="loading-message">
          <p>Loading appointments...</p>
        </div>
      )}
      
      <div className="calendar-view__filters">
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | 'home' | 'online' | 'showroom')}
            className="filter-select"
          >
            <option value="All">All Types</option>
            <option value="home">Home Measurement</option>
            <option value="online">Online Consultation</option>
            <option value="showroom">Showroom Visit</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show')}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      <div className="calendar-view__calendar">
        <AppointmentCalendar 
          appointments={appointments} 
          isLoading={appointmentsQuery.isLoading} 
        />
      </div>

      <style>{`
        .calendar-view__container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .calendar-view__filters {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .filter-select {
          height: 38px;
          padding: 0 12px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #1A1A18;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .filter-select:hover {
          border-color: #1A1A18;
        }

        .filter-select:focus {
          outline: none;
          border-color: #C8924A;
          box-shadow: 0 0 0 3px rgba(200, 146, 74, 0.1);
        }

        .calendar-view__calendar {
          width: 100%;
          min-height: 600px;
        }

        .error-message {
          padding: 16px 20px;
          background: #FEE2E2;
          border: 1.5px solid #DC2626;
          border-radius: 8px;
          color: #7F1D1D;
          font-size: 0.875rem;
        }

        .loading-message {
          padding: 16px 20px;
          background: #F0F9FF;
          border: 1.5px solid #0284C7;
          border-radius: 8px;
          color: #0C4A6E;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}
