import { getClientNamesList } from '@/lib/data-access'
import { ClientCampaignsView } from '@/components/client/ClientCampaignsView'

export default async function ClientCampaigns() {
  const clientNames = await getClientNamesList()

  return (
    <div>
      <div className="client-banner">
        <div className="who">Client Portal</div>
      </div>
      <ClientCampaignsView clientNames={clientNames} />
    </div>
  )
}