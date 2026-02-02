'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'

interface ApprovedContent {
  id: string
  idea_id: string
  character_id: string
  image_url: string
  image_prompt: string
  caption: string
  hashtags: string[]
  status: string
  created_at: string
}

export default function ContentPage() {
  const [content, setContent] = useState<ApprovedContent[]>([])
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
    fetchContent(token)
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

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    router.push('/')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Generated Content</h2>
          <button
            onClick={() => fetchContent(authToken)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">No content generated yet 📸</p>
            <p className="text-sm text-gray-500 mt-2">Approve some ideas to generate content!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Image Preview */}
                <div className="relative h-64 bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt="Generated content"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎨</div>
                        <p className="text-sm">Generating...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'ready' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Caption */}
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Caption:</h3>
                    <p className="text-sm text-gray-800">{item.caption}</p>
                  </div>

                  {/* Hashtags */}
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Hashtags:</h3>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(item.hashtags) ? (
                        item.hashtags.slice(0, 5).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No hashtags</span>
                      )}
                      {Array.isArray(item.hashtags) && item.hashtags.length > 5 && (
                        <span className="text-xs text-gray-500">+{item.hashtags.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {item.image_url && (
                      <a
                        href={item.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm text-center font-medium"
                      >
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => copyToClipboard(`${item.caption}\n\n${item.hashtags.join(' ')}`)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Copy Text
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}