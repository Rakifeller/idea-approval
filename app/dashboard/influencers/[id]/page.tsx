'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { InfluencerCharacter } from '@/lib/types'

interface ContentItem {
  id: string
  image_url: string
  caption: string
  status: string
  content_type: string
  created_at: string
}

interface Stats {
  pendingIdeas: number
  approvedContent: number
  photoContent: number
  videoContent: number
}

export default function InfluencerDetailPage() {
  const [character, setCharacter] = useState<InfluencerCharacter | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'pending'>('content') // ← info kaldır, default content
const [pendingIdeas, setPendingIdeas] = useState<any[]>([])
  const [content, setContent] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<Stats>({ 
    pendingIdeas: 0, 
    approvedContent: 0, 
    photoContent: 0, 
    videoContent: 0 
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [authToken, setAuthToken] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()
  const characterId = pathname?.split('/').pop() || ''

  useEffect(() => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    setAuthToken(token)
    fetchCharacterDetails(token)
  }, [router, characterId])

  const fetchCharacterDetails = async (token: string) => {
    setLoading(true)
    try {
      // Fetch character
      const charResponse = await fetch(`/api/characters/${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const charData = await charResponse.json()
      setCharacter(charData.character)

      // Fetch character's content
      const contentResponse = await fetch(`/api/character-content?character_id=${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const contentData = await contentResponse.json()
      setContent(contentData.content || [])

      // Fetch stats
      const statsResponse = await fetch(`/api/character-stats?character_id=${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsResponse.json()
      setStats(statsData.stats || { 
        pendingIdeas: 0, 
        approvedContent: 0, 
        photoContent: 0, 
        videoContent: 0 
      })
      const pendingResponse = await fetch(`/api/character-pending-ideas?character_id=${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const pendingData = await pendingResponse.json()
      setPendingIdeas(pendingData.ideas || [])
    } catch (err) {
      console.error('Failed to fetch character details:', err)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!character) return
    
    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(character)
      })

      if (response.ok) {
        setEditing(false)
        alert('Character updated successfully!')
        fetchCharacterDetails(authToken) // Refresh
      }
    } catch (err) {
      console.error('Failed to update character:', err)
      alert('Failed to update character')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    router.push('/')
  }

  if (loading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!character) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Character not found</p>
          <button
            onClick={() => router.push('/dashboard/influencers')}
            className="mt-4 text-purple-600 hover:text-purple-800"
          >
            ← Back to Influencers
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/influencers')}
          className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Influencers
        </button>

        {/* Profile Header - Instagram Style */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center ring-4 ring-purple-100">
                {character.reference_image_url ? (
                  <img 
                    src={character.reference_image_url} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">👤</span>
                )}
              </div>
            </div>

            

            {/* Profile Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-800">{character.name}</h1>
                  <span className="bg-purple-100 text-purple-800 px-4 py-1.5 rounded-full text-sm font-semibold">
                    {character.niche}
                  </span>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {editing ? '✕ Cancel' : '✏️ Edit Profile'}
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex gap-8 mb-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.approvedContent}</div>
                  <div className="text-sm text-gray-500">posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.pendingIdeas}</div>
                  <div className="text-sm text-gray-500">pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.photoContent}</div>
                  <div className="text-sm text-gray-500">photos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.videoContent}</div>
                  <div className="text-sm text-gray-500">videos</div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-700 mb-4 leading-relaxed">{character.bio}</p>

              {/* Quick Stats Chips */}
              <div className="flex flex-wrap gap-2">
                {character.age && (
                  <span className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    {character.age} years old
                  </span>
                )}
                {character.ethnicity && (
                  <span className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    {character.ethnicity}
                  </span>
                )}
                {character.height_cm && (
                  <span className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    {character.height_cm}cm
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form (Collapsible) */}
        {editing && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h3>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                  <input
                    type="text"
                    value={character.niche}
                    onChange={(e) => setCharacter({ ...character, niche: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={character.bio}
                  onChange={(e) => setCharacter({ ...character, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              {/* Physical Attributes - Compact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Physical Attributes</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="number"
                    placeholder="Age"
                    value={character.age || ''}
                    onChange={(e) => setCharacter({ ...character, age: parseInt(e.target.value) || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Height (cm)"
                    value={character.height_cm || ''}
                    onChange={(e) => setCharacter({ ...character, height_cm: parseInt(e.target.value) || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={character.weight_kg || ''}
                    onChange={(e) => setCharacter({ ...character, weight_kg: parseInt(e.target.value) || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Ethnicity"
                    value={character.ethnicity || ''}
                    onChange={(e) => setCharacter({ ...character, ethnicity: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Hair Color"
                    value={character.hair_color || ''}
                    onChange={(e) => setCharacter({ ...character, hair_color: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Eye Color"
                    value={character.eye_color || ''}
                    onChange={(e) => setCharacter({ ...character, eye_color: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Skin Tone"
                    value={character.skin_tone || ''}
                    onChange={(e) => setCharacter({ ...character, skin_tone: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Body Type"
                    value={character.body_type || ''}
                    onChange={(e) => setCharacter({ ...character, body_type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Image URL</label>
                <input
                  type="url"
                  value={character.reference_image_url || ''}
                  onChange={(e) => setCharacter({ ...character, reference_image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
<div className="border-b border-gray-200">
  <div className="flex gap-8">
    <button
      onClick={() => setActiveTab('content')}
      className={`pb-4 px-2 font-medium transition-colors ${
        activeTab === 'content'
          ? 'border-b-2 border-purple-600 text-purple-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      🎨 Content ({stats.approvedContent})
    </button>
    <button
      onClick={() => setActiveTab('pending')}
      className={`pb-4 px-2 font-medium transition-colors ${
        activeTab === 'pending'
          ? 'border-b-2 border-purple-600 text-purple-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      ⏳ Pending Ideas ({stats.pendingIdeas})
    </button>
  </div>
</div>

        {/* Tab Content */}
        {activeTab === 'content' ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Generated Content</h3>
            
            {content.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-xl text-gray-600 mb-2">No content yet</p>
                <p className="text-sm text-gray-500">Approve some ideas to start generating content!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {content.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative aspect-square bg-gray-100 overflow-hidden group cursor-pointer"
                  >
                    {item.image_url ? (
                      <>
                        <img 
                          src={item.image_url} 
                          alt="Content"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 text-white text-center p-4 transform scale-90 group-hover:scale-100 transition-all">
                            <div className="text-2xl mb-2">
                              {item.content_type === 'video' ? '🎥' : '📸'}
                            </div>
                            <div className="text-xs">
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.status === 'ready' 
                              ? 'bg-green-500 text-white'
                              : 'bg-yellow-500 text-white'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        {/* Video Icon */}
                        {item.content_type === 'video' && (
                          <div className="absolute bottom-2 right-2 text-white text-xl">
                            ▶️
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2 animate-pulse">⏳</div>
                          <div className="text-xs">Generating...</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Pending Ideas Tab */
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Pending Ideas</h3>
            
            {pendingIdeas.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💡</div>
                <p className="text-xl text-gray-600 mb-2">No pending ideas</p>
                <p className="text-sm text-gray-500">Assign some ideas from the Ideas page!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingIdeas.map((idea) => (
                  <div key={idea.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{idea.content_type === 'video' ? '🎥' : '📸'}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          idea.source_type === 'tiktok_trend' 
                            ? 'bg-pink-100 text-pink-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {idea.source_type === 'tiktok_trend' ? 'TikTok Trend' : 'RSS Feed'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-gray-500 mb-1">Inspiration:</h4>
                    <p className="text-sm text-gray-700 mb-3">{idea.inspiration_summary}</p>

                    <h4 className="text-sm font-medium text-gray-500 mb-1">Idea:</h4>
                    <p className="text-base text-gray-900 mb-3">{idea.idea_text}</p>

                    {idea.source_post_url && (
                      <a
                        href={idea.source_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View source →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
 