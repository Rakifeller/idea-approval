'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  hashtags: string[]
  media_type: string
  instagram_post_url?: string
  error_message?: string
  posted_at?: string
  character?: {
    name: string
  }
}

// ─── Post Type Config ────────────────────────────────────────────────
const POST_TYPES = {
  feed: { label: 'Feed', icon: '🖼️', description: 'Square post in feed' },
  story: { label: 'Story', icon: '📱', description: '24h vertical story' },
  reel: { label: 'Reel', icon: '🎬', description: 'Short-form video' },
} as const

type PostType = keyof typeof POST_TYPES

// ─── Lazy Media Component ────────────────────────────────────────────
function LazyMedia({ item, onOpenMedia }: { item: ApprovedContent; onOpenMedia: (url: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const isVideo = item.image_url?.endsWith('.mp4') || item.video_url?.endsWith('.mp4') || item.content_type === 'video'
  const mediaUrl = item.video_url || item.image_url || ''

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current) videoRef.current.play().catch(() => {})
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative aspect-square bg-gray-900 overflow-hidden cursor-pointer group"
      onMouseEnter={isVideo ? handleMouseEnter : undefined}
      onMouseLeave={isVideo ? handleMouseLeave : undefined}
      onClick={() => mediaUrl && onOpenMedia(mediaUrl)}
    >
      {!isVisible ? (
        <div className="w-full h-full bg-gray-800 animate-pulse" />
      ) : isVideo ? (
        <>
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
            <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            VIDEO
          </div>
        </>
      ) : mediaUrl ? (
        <>
          {!imageLoaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
          <img
            src={mediaUrl}
            alt="Content"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">No media</div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 pointer-events-none">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Lazy Thumbnail ──────────────────────────────────────────────────
function LazyThumbnail({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const isVideo = url?.endsWith('.mp4')

  return (
    <div ref={ref} className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
      {!isVisible ? (
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      ) : isVideo ? (
        <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
      ) : (
        <img src={url} alt="Post" loading="lazy" className="w-full h-full object-cover" />
      )}
    </div>
  )
}

// ─── Post Type Selector ──────────────────────────────────────────────
function PostTypeSelector({ value, onChange }: { value: PostType; onChange: (v: PostType) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(POST_TYPES) as PostType[]).map((type) => {
        const config = POST_TYPES[type]
        const isActive = value === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
              isActive
                ? 'border-purple-500 bg-purple-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{config.icon}</span>
            <span className={`text-xs font-semibold ${isActive ? 'text-purple-700' : 'text-gray-600'}`}>
              {config.label}
            </span>
            {isActive && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────
export default function ContentPage() {
  const [content, setContent] = useState<ApprovedContent[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'ready' | 'scheduled'>('ready')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ApprovedContent | null>(null)
  const [publishMode, setPublishMode] = useState<'schedule' | 'now'>('schedule')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishForm, setPublishForm] = useState({
    post_type: 'feed' as PostType,
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

  const openPublishModal = (contentItem: ApprovedContent, mode: 'schedule' | 'now' = 'schedule') => {
    const isVideo = contentItem.image_url?.endsWith('.mp4') || contentItem.video_url?.endsWith('.mp4') || contentItem.content_type === 'video'
    setSelectedContent(contentItem)
    setPublishMode(mode)
    setPublishForm({
      post_type: isVideo ? 'reel' : 'feed',
      scheduled_time: '',
      caption: contentItem.caption || ''
    })
    setShowPublishModal(true)
  }

  const handlePublish = async () => {
    if (!selectedContent) return

    if (publishMode === 'schedule' && !publishForm.scheduled_time) {
      alert('Please select a time')
      return
    }

    setIsPublishing(true)

    try {
      const payload: any = {
        content_id: selectedContent.id,
        character_id: selectedContent.character_id,
        post_type: publishForm.post_type,
        caption: publishForm.caption,
        hashtags: selectedContent.hashtags,
        media_url: selectedContent.video_url || selectedContent.image_url,
        media_type: selectedContent.content_type
      }

      if (publishMode === 'schedule') {
        payload.scheduled_time = publishForm.scheduled_time
      } else {
        payload.scheduled_time = new Date().toISOString()
        payload.post_now = true
      }

      const response = await fetch('/api/schedule-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowPublishModal(false)
        fetchScheduledPosts(authToken)
        fetchContent(authToken)
      } else {
        const err = await response.json().catch(() => ({}))
        alert(err.error || 'Failed to publish')
      }
    } catch (err) {
      console.error('Error publishing:', err)
      alert('Error publishing post')
    }
    setIsPublishing(false)
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openMediaInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    router.push('/')
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      'ready': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Ready' },
      'scheduled': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Scheduled' },
      'posting': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Posting...' },
      'posted': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Posted' },
      'failed': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' }
    }
    const badge = badges[status] || badges.ready
    return (
      <span className={`${badge.bg} ${badge.text} text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${status === 'posting' ? 'animate-pulse' : ''}`} />
        {badge.label}
      </span>
    )
  }

  const getPostTypeBadge = (type: string) => {
    const config = POST_TYPES[type as PostType]
    if (!config) return null
    return (
      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1">
        <span>{config.icon}</span>
        {config.label}
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
                  <LazyMedia item={item} onOpenMedia={openMediaInNewTab} />

                  {/* Info */}
                  <div className="px-4 pt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {item.character?.name || 'Unknown'} • {item.character?.niche}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="p-4 pt-2 space-y-3">
                    {item.caption && (
                      <p className="text-sm text-gray-700 line-clamp-3">{item.caption}</p>
                    )}

                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                        {item.hashtags.length > 3 && (
                          <span className="text-xs text-gray-500">+{item.hashtags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => openPublishModal(item, 'schedule')}
                        className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Schedule
                      </button>

                      <button
                        onClick={() => openPublishModal(item, 'now')}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-2 px-3 rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Post Now
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${item.caption || ''}\n\n${item.hashtags?.map(t => `#${t}`).join(' ') || ''}`,
                            item.id
                          )
                        }
                        className={`py-2 px-3 rounded-lg transition-colors text-sm ${
                          copiedId === item.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Copy caption & hashtags"
                      >
                        {copiedId === item.id ? '✅' : '📋'}
                      </button>

                      {(item.image_url || item.video_url) && (
                        <a
                          href={item.video_url || item.image_url}
                          download
                          className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          title="Download media"
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
                  <LazyThumbnail url={post.media_url} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{post.character?.name}</span>
                      {getPostTypeBadge(post.post_type)}
                      {getStatusBadge(post.status)}
                    </div>

                    {post.caption && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.caption}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(post.scheduled_time).toLocaleString()}
                      </span>
                      {post.instagram_post_url && (
                        <a
                          href={post.instagram_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline inline-flex items-center gap-1"
                        >
                          View on Instagram
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      {post.error_message && (
                        <span className="text-red-500 text-xs">Error: {post.error_message}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {post.status === 'scheduled' && (
                      <button
                        onClick={() => handleDeleteScheduled(post.id)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
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

      {/* ─── Publish Modal ──────────────────────────────────────────── */}
      {showPublishModal && selectedContent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPublishModal(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-5 text-white">
              <h3 className="text-lg font-bold">
                {publishMode === 'now' ? '🚀 Post Now' : '📅 Schedule Post'}
              </h3>
              <p className="text-white/80 text-sm mt-0.5">
                {selectedContent.character?.name} • {selectedContent.character?.niche}
              </p>
              <button
                onClick={() => setShowPublishModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    publishMode === 'schedule'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    publishMode === 'now'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Post Now
                </button>
              </div>

              {/* Post Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Post Type</label>
                <PostTypeSelector
                  value={publishForm.post_type}
                  onChange={(v) => setPublishForm({ ...publishForm, post_type: v })}
                />
              </div>

              {/* Schedule Time (only in schedule mode) */}
              {publishMode === 'schedule' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule Time</label>
                  <input
                    type="datetime-local"
                    value={publishForm.scheduled_time}
                    onChange={(e) => setPublishForm({ ...publishForm, scheduled_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all"
                  />
                </div>
              )}

              {/* Caption Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Caption</label>
                <textarea
                  value={publishForm.caption}
                  onChange={(e) => setPublishForm({ ...publishForm, caption: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-gray-50 resize-none transition-all"
                  placeholder="Write your caption..."
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-400">
                    {publishForm.caption.length} / 2,200
                  </span>
                  {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {selectedContent.hashtags.length} hashtags
                    </span>
                  )}
                </div>
              </div>

              {/* Media Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                  {(selectedContent.image_url?.endsWith('.mp4') || selectedContent.video_url) ? (
                    <video
                      src={selectedContent.video_url || selectedContent.image_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={selectedContent.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {selectedContent.image_url?.endsWith('.mp4') || selectedContent.video_url ? 'Video content' : 'Image content'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {POST_TYPES[publishForm.post_type].icon} Publishing as {POST_TYPES[publishForm.post_type].label}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || (publishMode === 'schedule' && !publishForm.scheduled_time)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  publishMode === 'now'
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white disabled:opacity-50'
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50'
                } ${isPublishing ? 'cursor-not-allowed' : ''}`}
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {publishMode === 'now' ? 'Posting...' : 'Scheduling...'}
                  </>
                ) : publishMode === 'now' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post Now
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation style */}
      <style jsx>{`
        .animate-in {
          animation: modalIn 0.2s ease-out;
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </DashboardLayout>
  )
}