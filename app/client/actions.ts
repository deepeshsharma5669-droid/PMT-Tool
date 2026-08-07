'use server'

import { getCampaignCardsForClient, getClientNamesList } from '@/lib/data-access'

export async function fetchClientCampaigns(clientName: string) {
  return getCampaignCardsForClient(clientName)
}

export async function fetchClientNames() {
  return getClientNamesList()
}