import client from './client'

export function getDashboardStats(days = 30, agentId = null) {
  const params = { days }
  if (agentId != null) params.agentId = agentId
  return client.get('/api/dashboard/stats', { params }).then(r => r.data)
}
