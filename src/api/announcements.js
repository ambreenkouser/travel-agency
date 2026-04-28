import client from './client'

export const getMyAnnouncements   = ()         => client.get('/api/announcements/my').then(r => r.data)
export const getSentAnnouncements  = ()         => client.get('/api/announcements/sent').then(r => r.data)
export const createAnnouncement    = (formData) => client.post('/api/announcements', formData).then(r => r.data)
export const deleteAnnouncement    = (id)       => client.delete(`/api/announcements/${id}`)
export const announcementImageUrl  = (id)       => `/api/announcements/${id}/image`
