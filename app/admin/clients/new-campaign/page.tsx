import { getClients, getManagers, getSequences } from '@/lib/data-access'
import { NewCampaignForm } from '@/components/admin/NewCampaignForm'

export default async function NewCampaignPage() {
  const clients = await getClients()
  const managers = await getManagers()
  const sequences = await getSequences()

  return (
    <div>
      <div className="crumb">
        <a href="/admin/clients" style={{ color: 'var(--ink-soft)', textDecoration: 'underline' }}>Clients</a>
        {' · New campaign'}
      </div>
      <NewCampaignForm
        clients={clients.map(c => ({ id: c.id, name: c.name }))}
        managers={managers.map(m => ({ id: m.id, name: m.name }))}
        sequences={sequences}
      />
    </div>
  )
}