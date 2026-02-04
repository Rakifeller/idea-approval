'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { InfluencerCharacter } from '@/lib/types'

export default function InfluencersListPage() {
  const [characters, setCharacters] = useState<InfluencerCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [authToken, setAuthToken] = useState<string>('')
  const router = useRouter()

  const [newCharacter, setNewCharacter] = useState<Partial<InfluencerCharacter>>({
    name: '',
    niche: '',
    bio: '',
    reference_image_url: '',
    age: undefined,
    height_cm: undefined,
    weight_kg: undefined,
    ethnicity: '',
    hair_color: '',
    eye_color: '',
    skin_tone: '',
    body_type: ''
  })

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

  const handleCreateCharacter = async () => {
    if (!newCharacter.name || !newCharacter.niche) {
      alert('Please fill in name and niche')
      return
    }

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
        fetchCharacters(authToken)
        setNewCharacter({
          name: '',
          niche: '',
          bio: '',
          reference_image_url: '',
          age: undefined,
          height_cm: undefined,
          weight_kg: undefined,
          ethnicity: '',
          hair_color: '',
          eye_color: '',
          skin_tone: '',
          body_type: ''
        })
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">AI Influencers</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
          >
            + Add New Influencer
          </button>
        </div>

        {/* Characters Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading influencers...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600 mb-4">No influencers yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
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
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                {/* Cover Image / Avatar */}
                <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500 relative">
                  {character.reference_image_url ? (
                    <img
                      src={character.reference_image_url}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      👤
                    </div>
                  )}
                  {/* Niche Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-purple-800 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      {character.niche}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{character.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{character.bio}</p>

                  {/* Stats Preview */}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {character.age && <span>👤 {character.age}y</span>}
                    {character.ethnicity && <span>🌍 {character.ethnicity}</span>}
                    {character.height_cm && <span>📏 {character.height_cm}cm</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-2xl font-bold text-gray-800">Create New Influencer</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={newCharacter.name}
                        onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                        placeholder="Ayla Stylish"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Niche *</label>
                      <input
                        type="text"
                        value={newCharacter.niche}
                        onChange={(e) => setNewCharacter({ ...newCharacter, niche: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                        placeholder="Fashion"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={newCharacter.bio}
                      onChange={(e) => setNewCharacter({ ...newCharacter, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                      placeholder="A fashion-forward influencer sharing style tips..."
                    />
                  </div>
                </div>

                {/* Physical Attributes */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Physical Attributes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Age"
                      value={newCharacter.age || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, age: parseInt(e.target.value) || undefined })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="number"
                      placeholder="Height (cm)"
                      value={newCharacter.height_cm || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, height_cm: parseInt(e.target.value) || undefined })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      value={newCharacter.weight_kg || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, weight_kg: parseInt(e.target.value) || undefined })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Ethnicity"
                      value={newCharacter.ethnicity || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, ethnicity: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Hair Color"
                      value={newCharacter.hair_color || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, hair_color: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Eye Color"
                      value={newCharacter.eye_color || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, eye_color: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Skin Tone"
                      value={newCharacter.skin_tone || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, skin_tone: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Body Type"
                      value={newCharacter.body_type || ''}
                      onChange={(e) => setNewCharacter({ ...newCharacter, body_type: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                </div>

                {/* Reference Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Image URL</label>
                  <input
                    type="url"
                    value={newCharacter.reference_image_url || ''}
                    onChange={(e) => setNewCharacter({ ...newCharacter, reference_image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCharacter}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Influencer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}