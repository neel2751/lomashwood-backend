"use client"
'use client'

import { useState } from 'react'

import { useParams } from 'next/navigation'

import { PermissionsMatrix } from '@/components/auth/PermissionsMatrix'
import { RoleForm } from '@/components/auth/RoleForm'
import { PageHeader } from '@/components/layout/PageHeader'

export default function RoleDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  const [permissions, setPermissions] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Role"
        description="Update this role and its permissions."
        backHref="/auth/roles"
      />
      <RoleForm roleId={id} />
      <PermissionsMatrix
        value={permissions}
        onChange={setPermissions}
      />
    </div>
  )
}
export const dynamic = 'force-dynamic'
