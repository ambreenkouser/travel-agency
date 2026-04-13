import client from './client'

export const getGrantablePermissions = () =>
    client.get('/api/permissions').then(r => r.data)
