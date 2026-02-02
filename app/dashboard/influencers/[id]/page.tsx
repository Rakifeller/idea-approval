'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { InfluencerCharacter } from '@/lib/types'

interface RSSSource {
  id: string
  rss_url: string
  source_name: string
  influencer_handle: string
  is_active: boolean
}

export default function InfluencerDetailPage() {
  const [character, setCharacter] = useState<InfluencerCharacter | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
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
      const response = await fetch(`/api/characters/${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.status === 401) {
        router.push('/')
        return
      }

      const data = await response.json()
      setCharacter(data.character)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/influencers')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-bold text-gray-800">{character.name}</h2>
            <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
              {character.niche}
            </span>
          </div>
          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Edit Character
              </button>
            )}
          </div>
        </div>

        {/* Character Details */}
        {/* Character Details */}
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-xl font-bold text-gray-800 mb-4">Character Details</h3>
  
  <div className="space-y-6">
    {/* Basic Info */}
    <div>
      <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Basic Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => setCharacter({ ...character, name: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
          <input
            type="text"
            value={character.niche}
            onChange={(e) => setCharacter({ ...character, niche: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={character.bio}
            onChange={(e) => setCharacter({ ...character, bio: e.target.value })}
            disabled={!editing}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
          />
        </div>
      </div>
    </div>

    {/* Physical Attributes */}
    <div>
      <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Physical Attributes</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
          <input
            type="number"
            value={character.age || ''}
            onChange={(e) => setCharacter({ ...character, age: parseInt(e.target.value) || undefined })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="25"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
          <input
            type="number"
            value={character.height_cm || ''}
            onChange={(e) => setCharacter({ ...character, height_cm: parseInt(e.target.value) || undefined })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="170"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
          <input
            type="number"
            value={character.weight_kg || ''}
            onChange={(e) => setCharacter({ ...character, weight_kg: parseInt(e.target.value) || undefined })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
          <input
            type="text"
            value={character.ethnicity || ''}
            onChange={(e) => setCharacter({ ...character, ethnicity: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="Turkish"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hair Color</label>
          <input
            type="text"
            value={character.hair_color || ''}
            onChange={(e) => setCharacter({ ...character, hair_color: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="Dark brown"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Eye Color</label>
          <input
            type="text"
            value={character.eye_color || ''}
            onChange={(e) => setCharacter({ ...character, eye_color: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="Brown"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skin Tone</label>
          <input
            type="text"
            value={character.skin_tone || ''}
            onChange={(e) => setCharacter({ ...character, skin_tone: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="Olive"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
          <input
            type="text"
            value={character.body_type || ''}
            onChange={(e) => setCharacter({ ...character, body_type: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
            placeholder="Athletic"
          />
        </div>
      </div>
    </div>

    {/* Reference Image */}
    <div>
      <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Reference Image</h4>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
        <input
          type="url"
          value={character.reference_image_url || ''}
          onChange={(e) => setCharacter({ ...character, reference_image_url: e.target.value })}
          disabled={!editing}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-gray-900"
        />
        {character.reference_image_url && (
          <div className="mt-4">
            <img 
              src={character.reference_image_url} 
              alt="Reference" 
              className="h-48 w-48 object-cover rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    </div>
  </div>
</div>
      </div>
    </DashboardLayout>
  )
}