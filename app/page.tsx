'use client'

import { useState, useEffect } from 'react'
import { ContentIdea } from '@/lib/types'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [authToken, setAuthToken] = useState<string>('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password) {
      setAuthToken(password)
      setIsAuthenticated(true)
      setError('')
      fetchIdeas(password)
    } else {
      setError('Please enter a password')
    }
  }

  const fetchIdeas = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/pending-ideas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        setIsAuthenticated(false)
        setError('Invalid password')
        setLoading(false)
        return
      }

      const data = await response.json()
      setIdeas(data.ideas || [])
    } catch (err) {
      setError('Failed to fetch ideas')
      console.error(err)
    }
    setLoading(false)
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
      } else {
        alert('Failed to approve idea')
      }
    } catch (err) {
      alert('Error approving idea')
      console.error(err)
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
      } else {
        alert('Failed to reject idea')
      }
    } catch (err) {
      alert('Error rejecting idea')
      console.error(err)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            AI Influencer Dashboard
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Content Ideas Approval
          </h1>
          <button
            onClick={() => fetchIdeas(authToken)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading ideas...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">No pending ideas to review 🎉</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <div key={idea.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {(idea as any).influencer_characters?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Inspiration Summary:</h3>
                  <p className="text-sm text-gray-700 mb-3">{idea.inspiration_summary}</p>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-1">AI Generated Idea:</h3>
                  <p className="text-base text-gray-900 font-medium mb-3">{idea.idea_text}</p>
                  
                  <a
                    href={idea.source_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    View original post →
                  </a>
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
    </main>
  )
}
