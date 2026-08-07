import { clients } from './data/mock-clients'
import { users } from './data/mock-users'
import { systemStats, escalations } from './data/mock-overview'

export async function getClients() {
  return clients
}

export async function getUsers() {
  return users
}

export async function getSystemOverview() {
  return { stats: systemStats, escalations }
}