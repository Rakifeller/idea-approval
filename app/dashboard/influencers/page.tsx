'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  const [content, setContent] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<Stats>({ pendingIdeas: 0, approvedContent: 0, photoContent: 0, videoContent: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info')
  const [authToken, setAuthToken] = useState<string>('')
  const router = useRouter()
  const params = useParams()
  const characterId = params.id as string

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
      setStats(statsData.stats || { pendingIdeas: 0, approvedContent: 0, photoContent: 0, videoContent: 0 })
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
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header - Instagram Style */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                {character.reference_image_url ? (
                  <img 
                    src={character.reference_image_url} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">👤</span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-800">{character.name}</h1>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {character.niche}
                  </span>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  {editing ? '✕ Cancel Edit' : '✏️ Edit Profile'}
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex gap-8 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.approvedContent}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.pendingIdeas}</div>
                  <div className="text-sm text-gray-500">Pending Ideas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.photoContent}</div>
                  <div className="text-sm text-gray-500">📸 Photos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.videoContent}</div>
                  <div className="text-sm text-gray-500">🎥 Videos</div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-700 mb-4">{character.bio}</p>

              {/* Physical Attributes - Compact Display */}
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                {character.age && <span className="bg-gray-100 px-2 py-1 rounded">👤 {character.age}y</span>}
                {character.ethnicity && <span className="bg-gray-100 px-2 py-1 rounded">🌍 {character.ethnicity}</span>}
                {character.height_cm && <span className="bg-gray-100 px-2 py-1 rounded">📏 {character.height_cm}cm</span>}
                {character.hair_color && <span className="bg-gray-100 px-2 py-1 rounded">💇 {character.hair_color}</span>}
                {character.eye_color && <span className="bg-gray-100 px-2 py-1 rounded">👁️ {character.eye_color}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Information
            </button>
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
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          /* Information Tab */
          <div className="bg-white rounded-lg shadow p-6">
            {editing ? (
              /* Edit Mode - Form */
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
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

                {/* Physical Attributes - Compact Grid */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Physical Attributes</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Age</label>
                      <input
                        type="number"
                        value={character.age || ''}
                        onChange={(e) => setCharacter({ ...character, age: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={character.height_cm || ''}
                        onChange={(e) => setCharacter({ ...character, height_cm: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={character.weight_kg || ''}
                        onChange={(e) => setCharacter({ ...character, weight_kg: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ethnicity</label>
                      <input
                        type="text"
                        value={character.ethnicity || ''}
                        onChange={(e) => setCharacter({ ...character, ethnicity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hair Color</label>
                      <input
                        type="text"
                        value={character.hair_color || ''}
                        onChange={(e) => setCharacter({ ...character, hair_color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Eye Color</label>
                      <input
                        type="text"
                        value={character.eye_color || ''}
                        onChange={(e) => setCharacter({ ...character, eye_color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Skin Tone</label>
                      <input
                        type="text"
                        value={character.skin_tone || ''}
                        onChange={(e) => setCharacter({ ...character, skin_tone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Body Type</label>
                      <input
                        type="text"
                        value={character.body_type || ''}
                        onChange={(e) => setCharacter({ ...character, body_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
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

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode - Clean Display */
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
                  <p className="text-gray-800">{character.bio}</p>
                </div>

                {(character.age || character.ethnicity || character.height_cm || character.weight_kg) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Physical Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {character.age && (
                        <div>
                          <div className="text-xs text-gray-500">Age</div>
                          <div className="text-lg font-medium text-gray-800">{character.age} years</div>
                        </div>
                      )}
                      {character.height_cm && (
                        <div>
                          <div className="text-xs text-gray-500">Height</div>
                          <div className="text-lg font-medium text-gray-800">{character.height_cm} cm</div>
                        </div>
                      )}
                      {character.weight_kg && (
                        <div>
                          <div className="text-xs text-gray-500">Weight</div>
                          <div className="text-lg font-medium text-gray-800">{character.weight_kg} kg</div>
                        </div>
                      )}
                      {character.ethnicity && (
                        <div>
                          <div className="text-xs text-gray-500">Ethnicity</div>
                          <div className="text-lg font-medium text-gray-800">{character.ethnicity}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(character.hair_color || character.eye_color || character.skin_tone || character.body_type) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Appearance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {character.hair_color && (
                        <div>
                          <div className="text-xs text-gray-500">Hair</div>
                          <div className="text-lg font-medium text-gray-800">{character.hair_color}</div>
                        </div>
                      )}
                      {character.eye_color && (
                        <div>
                          <div className="text-xs text-gray-500">Eyes</div>
                          <div className="text-lg font-medium text-gray-800">{character.eye_color}</div>
                        </div>
                      )}
                      {character.skin_tone && (
                        <div>
                          <div className="text-xs text-gray-500">Skin Tone</div>
                          <div className="text-lg font-medium text-gray-800">{character.skin_tone}</div>
                        </div>
                      )}
                      {character.body_type && (
                        <div>
                          <div className="text-xs text-gray-500">Body Type</div>
                          <div className="text-lg font-medium text-gray-800">{character.body_type}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Content Tab - Instagram Grid */
          <div>
            {content.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-xl text-gray-600">No content generated yet 📸</p>
                <p className="text-sm text-gray-500 mt-2">Approve some ideas to generate content!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {content.map((item) => (
                  <div key={item.id} className="relative aspect-square bg-gray-100 rounded overflow-hidden group cursor-pointer">
                    {item.image_url ? (
                      <>
                        <img 
                          src={item.image_url} 
                          alt="Content"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {/* Overlay on Hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 text-white text-center p-4">
                            <div className="text-sm font-medium mb-2">
                              {item.content_type === 'video' ? '🎥 Video' : '📸 Photo'}
                            </div>
                            <div className="text-xs">
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.status === 'ready' 
                              ? 'bg-green-500 text-white'
                              : 'bg-yellow-500 text-white'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        {/* Content Type Icon */}
                        {item.content_type === 'video' && (
                          <div className="absolute bottom-2 right-2 text-white text-2xl">
                            ▶️
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">⏳</div>
                          <div className="text-xs">Generating...</div>
                        </div>
                      </div>
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