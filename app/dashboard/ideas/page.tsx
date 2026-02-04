'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { ContentIdea } from '@/lib/types'

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [filteredIdeas, setFilteredIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [authToken, setAuthToken] = useState<string>('')
  
  // Filter states
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all')
  
  const router = useRouter()

  useEffect(() => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    setAuthToken(token)
    fetchIdeas(token)
  }, [router])

  useEffect(() => {
    // Apply filters
    let filtered = ideas

    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(idea => idea.content_type === contentTypeFilter)
    }

    if (sourceTypeFilter !== 'all') {
      filtered = filtered.filter(idea => idea.source_type === sourceTypeFilter)
    }

    setFilteredIdeas(filtered)
  }, [ideas, contentTypeFilter, sourceTypeFilter])

  const fetchIdeas = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/pending-ideas', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        router.push('/')
        return
      }

      const data = await response.json()
      setIdeas(data.ideas || [])
      setFilteredIdeas(data.ideas || [])
    } catch (err) {
      console.error('Failed to fetch ideas:', err)
    }
    setLoading(false)
  }

  const handleGenerateFromTrends = async () => {
    // Character ID'yi nereden alacağız? Şimdilik ilk character'ı kullanalım
    // Veya modal açıp seçtirebiliriz
    
    setGenerating(true)
    try {
      // Önce character listesini al
      const charsResponse = await fetch('/api/characters', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const charsData = await charsResponse.json()
      
      if (charsData.characters && charsData.characters.length > 0) {
        const firstChar = charsData.characters[0]
        
        // n8n webhook'u tetikle
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_TIKTOK_WEBHOOK_URL || ''
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            character_id: firstChar.id
          })
        })
        
        alert('TikTok trend ideas are being generated! Refresh in a few moments.')
      }
    } catch (err) {
      console.error('Error generating trends:', err)
      alert('Failed to generate trends')
    }
    setGenerating(false)
  }

  const handleApprove = async (ideaId: string) => {
    try {
      const response = await fetch('/api/approve-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ ideaId })
      })

      if (response.ok) {
        setIdeas(ideas.filter(idea => idea.id !== ideaId))
        
        // Trigger content generation webhook
        await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            trigger: 'idea_approved',
            idea_id: ideaId,
            timestamp: new Date().toISOString()
          })
        })
      }
    } catch (err) {
      console.error('Error approving idea:', err)
    }
  }

  const handleReject = async (ideaId: string) => {
    try {
      const response = await fetch('/api/reject-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ ideaId })
      })

      if (response.ok) {
        setIdeas(ideas.filter(idea => idea.id !== ideaId))
      }
    } catch (err) {
      console.error('Error rejecting idea:', err)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    router.push('/')
  }

  const getContentTypeIcon = (type: string) => {
    return type === 'video' ? '🎥' : '📸'
  }

  const getSourceTypeBadge = (type: string) => {
    const badges = {
      'rss': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'RSS Feed' },
      'tiktok_trend': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'TikTok Trend' },
      'manual': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Manual' }
    }
    
    const badge = badges[type as keyof typeof badges] || badges.manual
    return (
      <span className={`${badge.bg} ${badge.text} text-xs font-semibold px-2 py-1 rounded`}>
        {badge.label}
      </span>
    )
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Pending Ideas</h2>
          <div className="flex gap-3">
            <button
              onClick={() => fetchIdeas(authToken)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleGenerateFromTrends}
              disabled={generating}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {generating ? '⏳ Generating...' : '✨ Generate from TikTok Trends'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Content Type:</label>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-900"
              >
                <option value="all">All</option>
                <option value="photo">📸 Photo</option>
                <option value="video">🎥 Video</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Source:</label>
              <select
                value={sourceTypeFilter}
                onChange={(e) => setSourceTypeFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-900"
              >
                <option value="all">All</option>
                <option value="rss">RSS Feed</option>
                <option value="tiktok_trend">TikTok Trend</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredIdeas.length} of {ideas.length} ideas
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading ideas...</p>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">No pending ideas to review 🎉</p>
            <button
              onClick={handleGenerateFromTrends}
              className="mt-4 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
            >
              Generate from TikTok Trends
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map((idea) => (
              <div key={idea.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getContentTypeIcon(idea.content_type)}</span>
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {(idea as any).influencer_characters?.name || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-3">
                    {getSourceTypeBadge(idea.source_type)}
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Inspiration:</h3>
                  <p className="text-sm text-gray-700 mb-3">{idea.inspiration_summary}</p>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Generated Idea:</h3>
                  <p className="text-base text-gray-900 font-medium mb-3">{idea.idea_text}</p>
                  
                  {idea.source_post_url && (
                    <a
                      href={idea.source_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline inline-flex items-center"
                    >
                      View source →
                    </a>
                  )}
                </div>
                
                <div className="mt-auto pt-4 flex gap-3">
                  <button
                    onClick={() => handleApprove(idea.id)}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(idea.id)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}