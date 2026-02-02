'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { ContentIdea } from '@/lib/types'

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string>('')
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
    } catch (err) {
      console.error('Failed to fetch ideas:', err)
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
        
        // ✨ Trigger n8n webhook
        try {
          await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              trigger: 'idea_approved',
              idea_id: ideaId,
              timestamp: new Date().toISOString()
            })
          })
          console.log('Content generation triggered')
        } catch (webhookError) {
          console.error('Webhook trigger failed:', webhookError)
          // Webhook fail olsa bile devam et
        }
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

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Pending Ideas</h2>
          <button
            onClick={() => fetchIdeas(authToken)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
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
              <div key={idea.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {(idea as any).influencer_characters?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Inspiration:</h3>
                  <p className="text-sm text-gray-700 mb-3">{idea.inspiration_summary}</p>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Generated Idea:</h3>
                  <p className="text-base text-gray-900 font-medium mb-3">{idea.idea_text}</p>
                  
                  
                  <a
                    href={idea.source_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline inline-flex items-center"
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
    </DashboardLayout>
  )
}