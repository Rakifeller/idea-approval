import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('character_id')

    if (!characterId) {
      return NextResponse.json({ error: 'character_id required' }, { status: 400 })
    }

    const { data: content, error } = await supabase
      .from('approved_content')
      .select('id, image_url, caption, status, created_at, idea_id')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get content_type from related idea
    const contentWithType = await Promise.all(
      (content || []).map(async (item) => {
        const { data: idea } = await supabase
          .from('content_ideas')
          .select('content_type')
          .eq('id', item.idea_id)
          .single()
        
        return {
          ...item,
          content_type: idea?.content_type || 'photo'
        }
      })
    )

    return NextResponse.json({ content: contentWithType })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}