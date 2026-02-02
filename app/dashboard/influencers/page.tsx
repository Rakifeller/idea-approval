'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { InfluencerCharacter } from '@/lib/types'

export default function InfluencersPage() {
  const [characters, setCharacters] = useState<InfluencerCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    niche: '',
    bio: '',
    reference_image_url: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    ethnicity: '',
    hair_color: '',
    eye_color: '',
    skin_tone: '',
    body_type: ''
  })
  const router = useRouter()

  useEffect(() => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    setAuthToken(token)
    fetchCharacters(token)
  }, [router])

  const fetchCharacters = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/characters', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        router.push('/')
        return
      }

      const data = await response.json()
      setCharacters(data.characters || [])
    } catch (err) {
      console.error('Failed to fetch characters:', err)
    }
    setLoading(false)
  }

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newCharacter)
      })

      if (response.ok) {
        setShowModal(false)
        setNewCharacter({ 
          name: '', 
          niche: '', 
          bio: '', 
          reference_image_url: '',
          age: '',
          height_cm: '',
          weight_kg: '',
          ethnicity: '',
          hair_color: '',
          eye_color: '',
          skin_tone: '',
          body_type: ''
        })
        fetchCharacters(authToken)
      }
    } catch (err) {
      console.error('Failed to create character:', err)
      alert('Failed to create character')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    router.push('/')
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">AI Influencers</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add New Influencer
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading influencers...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">No influencers created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Create Your First Influencer
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <div 
                key={character.id} 
                onClick={() => router.push(`/dashboard/influencers/${character.id}`)}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                {/* Character Image */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  {character.reference_image_url ? (
                    <img src={character.reference_image_url} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">👤</div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{character.name}</h3>
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {character.niche}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{character.bio}</p>
                  
                  <div className="text-sm text-purple-600 font-medium">
                    View Details →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Influencer</h3>
            
            <form onSubmit={handleCreateCharacter} className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <input
          type="text"
          value={newCharacter.name}
          onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., Ayla Stylish"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Niche *</label>
        <input
          type="text"
          value={newCharacter.niche}
          onChange={(e) => setNewCharacter({ ...newCharacter, niche: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., fashion, travel, fitness"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
        <textarea
          value={newCharacter.bio}
          onChange={(e) => setNewCharacter({ ...newCharacter, bio: e.target.value })}
          required
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="Short bio for this influencer..."
        />
      </div>
    </div>
  </div>

  {/* Physical Attributes */}
  <div className="border-b pb-4">
    <h4 className="font-semibold text-gray-700 mb-3">Physical Attributes</h4>
    
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
        <input
          type="number"
          value={newCharacter.age}
          onChange={(e) => setNewCharacter({ ...newCharacter, age: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., 25"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
        <input
          type="number"
          value={newCharacter.height_cm}
          onChange={(e) => setNewCharacter({ ...newCharacter, height_cm: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., 170"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
        <input
          type="number"
          value={newCharacter.weight_kg}
          onChange={(e) => setNewCharacter({ ...newCharacter, weight_kg: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., 60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
        <input
          type="text"
          value={newCharacter.ethnicity}
          onChange={(e) => setNewCharacter({ ...newCharacter, ethnicity: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., Turkish, Mediterranean"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hair Color</label>
        <input
          type="text"
          value={newCharacter.hair_color}
          onChange={(e) => setNewCharacter({ ...newCharacter, hair_color: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., Dark brown, Black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Eye Color</label>
        <input
          type="text"
          value={newCharacter.eye_color}
          onChange={(e) => setNewCharacter({ ...newCharacter, eye_color: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., Brown, Hazel"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Skin Tone</label>
        <input
          type="text"
          value={newCharacter.skin_tone}
          onChange={(e) => setNewCharacter({ ...newCharacter, skin_tone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., Olive, Fair, Tan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
        <input
          type="text"
          value={newCharacter.body_type}
          onChange={(e) => setNewCharacter({ ...newCharacter, body_type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="e.g., Athletic, Slim, Curvy"
        />
      </div>
    </div>
  </div>

  {/* Reference Image */}
  <div>
    <h4 className="font-semibold text-gray-700 mb-3">Reference Image</h4>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
      <input
        type="url"
        value={newCharacter.reference_image_url}
        onChange={(e) => setNewCharacter({ ...newCharacter, reference_image_url: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
        placeholder="https://example.com/image.jpg"
      />
    </div>
  </div>

  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
    <button
      type="button"
      onClick={() => setShowModal(false)}
      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
    >
      Create
    </button>
  </div>
</form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}