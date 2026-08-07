'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createCampaignAction(formData: FormData) {
  const supabase = await createClient()

  const clientId = formData.get('clientId') as string
  const projectName = formData.get('projectName') as string
  const startDate = formData.get('startDate') as string
  const managerName = formData.get('managerName') as string
  const deliverablesJson = formData.get('deliverables') as string
  const deliverables = JSON.parse(deliverablesJson) as { name: string; type: string }[]

  const { data: clientRow, error: clientError } = await supabase
    .from('clients')
    .select('name')
    .eq('id', Number(clientId))
    .single()

  if (clientError || !clientRow) {
    console.error('createCampaignAction client lookup error:', clientError)
    throw new Error('Could not find the selected client.')
  }

  const { data: newProject, error: projectError } = await supabase
    .from('projects')
    .insert({
      project_name: projectName,
      client_id: Number(clientId),
      client_name: clientRow.name,
      content_format: deliverables[0]?.type || 'Mixed',
      start_date: startDate,
      end_date: null,
      status: 'New',
      manager: managerName ? [managerName] : [],
      assignee: [],
      priority: 'Medium',
      time_scale: null,
      completion_percent: 0,
      deliverables: deliverables.length,
    })
    .select()
    .single()

  if (projectError || !newProject) {
    console.error('createCampaignAction error:', projectError)
    throw new Error(projectError?.message || 'Failed to create project.')
  }

  const { data: typeMap } = await supabase.from('sequence_deliverable_types').select('*')
  const { data: allSeqStages } = await supabase.from('sequence_stages').select('*').order('stage_order')

  for (const [i, deliv] of deliverables.entries()) {
    const matchedType = typeMap?.find(t => t.type_name === deliv.type)
    const sequenceId = matchedType?.sequence_id ?? null

    const { data: newDeliverable } = await supabase
      .from('deliverables')
      .insert({
        project_id: newProject.id,
        name: deliv.name || `Deliverable ${i + 1}`,
        content_format: deliv.type,
        sequence_id: sequenceId,
      })
      .select()
      .single()

    if (newDeliverable && sequenceId) {
      const stagesForSeq = (allSeqStages ?? []).filter(s => s.sequence_id === sequenceId)

      const stageRows = stagesForSeq.map((s, idx) => ({
        deliverable_id: newDeliverable.id,
        stage_name: s.stage_name,
        department: s.department,
        status: idx === 0 ? 'in_progress' : 'pending',
        stage_order: idx,
      }))

      if (stageRows.length > 0) {
        await supabase.from('deliverable_stages').insert(stageRows)
      }
    }
  }

  revalidatePath('/admin/clients')
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const accountManager = formData.get('accountManager') as string

  const { error } = await supabase.from('clients').insert({
    name,
    email,
    account_manager: accountManager,
    status: 'Active',
  })

  if (error) {
    console.error('createClientAction error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/clients')
}

export async function addHolidayAction(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const date = formData.get('date') as string

  const { error } = await supabase.from('holidays').insert({ name, date })
  if (error) {
    console.error('addHolidayAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/admin/settings')
}

export async function removeHolidayAction(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) {
    console.error('removeHolidayAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/admin/settings')
}

export async function updateOrgSettingsAction(formData: FormData) {
  const supabase = await createClient()
  const timezone = formData.get('timezone') as string
  const dayStarts = formData.get('dayStarts') as string
  const dayEnds = formData.get('dayEnds') as string

  const { data: existing } = await supabase.from('org_settings').select('id').limit(1).single()

  if (existing) {
    const { error } = await supabase
      .from('org_settings')
      .update({ timezone, day_starts: dayStarts, day_ends: dayEnds, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) {
      console.error('updateOrgSettingsAction error:', error)
      throw new Error(error.message)
    }
  }

  revalidatePath('/admin/settings')
}

export async function inviteUserAction(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const department = formData.get('department') as string
  const role = formData.get('role') as string

  const { error } = await supabase.from('managers').insert({ name, email, department, role })
  if (error) {
    console.error('inviteUserAction error:', error)
    throw new Error(error.message)
  }

  // Creates a real Supabase Auth account and emails the person a link to set their password.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, role, department },
    redirectTo: `${siteUrl}/auth/set-password`,
  })

  if (inviteError) {
    // The managers row is already created; log this so it can be retried without duplicating the roster entry.
    console.error('Failed to send Supabase auth invite:', inviteError)
  }

  revalidatePath('/admin/users')
}

export async function createSequenceAction(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isDefault = formData.get('isDefault') === 'on'
  const stagesJson = formData.get('stages') as string
  const stages = JSON.parse(stagesJson) as { name: string; department: string }[]
  const typesJson = formData.get('deliverableTypes') as string
  const deliverableTypes = typesJson ? (JSON.parse(typesJson) as string[]) : []

  if (isDefault) {
    await supabase.from('sequences').update({ is_default: false }).neq('id', 0)
  }

  const { data: newSeq, error } = await supabase
    .from('sequences')
    .insert({ name, description, is_default: isDefault })
    .select()
    .single()

  if (error) {
    console.error('createSequenceAction error:', error)
    throw new Error(error.message)
  }

  const stageRows = stages.map((stage, i) => ({
    sequence_id: newSeq.id,
    stage_name: stage.name,
    department: stage.department,
    stage_order: i + 1,
  }))

  await supabase.from('sequence_stages').insert(stageRows)

  if (deliverableTypes.length > 0) {
    const typeRows = deliverableTypes.map(type_name => ({
      sequence_id: newSeq.id,
      type_name,
    }))
    const { error: typeError } = await supabase.from('sequence_deliverable_types').insert(typeRows)
    if (typeError) {
      // Most likely a duplicate type_name already claimed by another sequence (UNIQUE constraint).
      console.error('createSequenceAction deliverable types error:', typeError)
    }
  }

  revalidatePath('/admin/sequences')
}

export async function clientApproveStageAction(deliverableStageId: number, feedback: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ status: 'complete', note: feedback || null })
    .eq('id', deliverableStageId)
  if (error) throw new Error(error.message)
  revalidatePath('/client')
}

export async function clientRequestChangesAction(deliverableStageId: number, feedback: string) {
  const supabase = await createClient()
  const { data: stage } = await supabase.from('deliverable_stages').select('revision_count').eq('id', deliverableStageId).single()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ status: 'feedback', note: feedback, revision_count: (stage?.revision_count ?? 0) + 1 })
    .eq('id', deliverableStageId)
  if (error) throw new Error(error.message)
  revalidatePath('/client')
}