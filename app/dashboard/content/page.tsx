'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'

interface ApprovedContent {
  id: string
  idea_id: string
  character_id: string
  image_url?: string
  video_url?: string
  caption: string
  hashtags: string[]
  status: string
  created_at: string
  content_type: 'photo' | 'video'
  character?: {
    id: string
    name: string
    niche: string
  }
}

interface ScheduledPost {
  id: string
  content_id: string
  character_id: string
  post_type: 'feed' | 'story' | 'reel'
  scheduled_time: string
  status: 'scheduled' | 'posting' | 'posted' | 'failed'
  media_url: string
  caption: string
  instagram_post_url?: string
  character?: {
    name: string
  }
}

export default function ContentPage() {
  const [content, setContent] = useState<ApprovedContent[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'ready' | 'scheduled'>('ready')
  
  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ApprovedContent | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    post_type: 'feed' as 'feed' | 'story' | 'reel',
    scheduled_time: '',
    caption: ''
  })
  
  const router = useRouter()

  useEffect(() => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    setAuthToken(token)
    fetchContent(token)
    fetchScheduledPosts(token)
  }, [router])

  const fetchContent = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/approved-content', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        router.push('/')
        return
      }

      const data = await response.json()
      setContent(data.content || [])
    } catch (err) {
      console.error('Failed to fetch content:', err)
    }
    setLoading(false)
  }

  const fetchScheduledPosts = async (token: string) => {
    try {
      const response = await fetch('/api/schedule-post', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data.scheduled_posts || [])
      }
    } catch (err) {
      console.error('Failed to fetch scheduled posts:', err)
    }
  }

  const openScheduleModal = (contentItem: ApprovedContent) => {
    setSelectedContent(contentItem)
    setScheduleForm({
      post_type: contentItem.content_type === 'video' ? 'reel' : 'feed',
      scheduled_time: '',
      caption: contentItem.caption
    })
    setShowScheduleModal(true)
  }

  const handleSchedulePost = async () => {
    if (!selectedContent || !scheduleForm.scheduled_time) {
      alert('Please select a time')
      return
    }

    try {
      const response = await fetch('/api/schedule-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content_id: selectedContent.id,
          character_id: selectedContent.character_id,
          post_type: scheduleForm.post_type,
          scheduled_time: scheduleForm.scheduled_time,
          caption: scheduleForm.caption,
          hashtags: selectedContent.hashtags,
          media_url: selectedContent.video_url || selectedContent.image_url,
          media_type: selectedContent.content_type
        })
      })

      if (response.ok) {
        alert('Post scheduled successfully!')
        setShowScheduleModal(false)
        fetchScheduledPosts(authToken)
      } else {
        alert('Failed to schedule post')
      }
    } catch (err) {
      console.error('Error scheduling post:', err)
      alert('Error scheduling post')
    }
  }

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm('Delete this scheduled post?')) return

    try {
      const response = await fetch(`/api/schedule-post/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      if (response.ok) {
        setScheduledPosts(scheduledPosts.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error('Error deleting scheduled post:', err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    router.push('/')
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'ready': { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
      'scheduled': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
      'posting': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Posting...' },
      'posted': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Posted' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.ready
    return (
      <span className={`${badge.bg} ${badge.text} text-xs font-semibold px-2 py-1 rounded`}>
        {badge.label}
      </span>
    )
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Content Management</h2>
          <button
            onClick={() => {
              fetchContent(authToken)
              fetchScheduledPosts(authToken)
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ready')}
              className={`${
                activeTab === 'ready'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Ready to Post ({content.length})
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`${
                activeTab === 'scheduled'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Scheduled ({scheduledPosts.length})
            </button>
          </nav>
        </div>

        {/* Ready Content Tab */}
        {activeTab === 'ready' && (
          loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-xl text-gray-600">No content ready yet</p>
              <p className="text-sm text-gray-500 mt-2">Approve some ideas first!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Media Preview */}
                  <div className="relative aspect-square bg-gray-100">
                    {item.video_url ? (
                      <video
                        src={item.video_url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : item.image_url ? (
                      <img
                        src={item.image_url}
                        alt="Content"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No media
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {item.character?.name || 'Unknown'} • {item.character?.niche}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-700 line-clamp-3">{item.caption}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.hashtags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                      {item.hashtags?.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{item.hashtags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => openScheduleModal(item)}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        📅 Schedule
                      </button>
                      <button
                        onClick={() => copyToClipboard(`${item.caption}\n\n${item.hashtags?.map(t => `#${t}`).join(' ')}`)}
                        className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        📋
                      </button>
                      {(item.image_url || item.video_url) && (
                        <a
                          href={item.video_url || item.image_url}
                          download
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          ⬇️
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Scheduled Posts Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            {scheduledPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-xl text-gray-600">No scheduled posts</p>
              </div>
            ) : (
              scheduledPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow p-6 flex items-center gap-6">
                  {/* Thumbnail */}
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {post.media_url.endsWith('.mp4') ? (
                      <video src={post.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-800">{post.character?.name}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {post.post_type.toUpperCase()}
                      </span>
                      {getStatusBadge(post.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.caption}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(post.scheduled_time).toLocaleString()}</span>
                      {post.instagram_post_url && (
                        <a
                          href={post.instagram_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          View on Instagram →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {post.status === 'scheduled' && (
                      <button
                        onClick={() => handleDeleteScheduled(post.id)}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Schedule Post</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                <select
                  value={scheduleForm.post_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, post_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="feed">Feed Post</option>
                  <option value="story">Story</option>
                  <option value="reel">Reel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Time</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduled_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <textarea
                  value={scheduleForm.caption}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, caption: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div className="text-xs text-gray-500">
                Hashtags: {selectedContent.hashtags?.join(', ')}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedulePost}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}