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

    // Count pending ideas
    const { count: pendingIdeas } = await supabase
      .from('content_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('character_id', characterId)
      .eq('status', 'pending')

    // Count approved content
    const { count: approvedContent } = await supabase
      .from('approved_content')
      .select('*', { count: 'exact', head: true })
      .eq('character_id', characterId)

    // Count by content type
    const { data: ideas } = await supabase
      .from('content_ideas')
      .select('content_type')
      .eq('character_id', characterId)
      .eq('status', 'approved')

    const photoContent = ideas?.filter(i => i.content_type === 'photo').length || 0
    const videoContent = ideas?.filter(i => i.content_type === 'video').length || 0

    return NextResponse.json({
      stats: {
        pendingIdeas: pendingIdeas || 0,
        approvedContent: approvedContent || 0,
        photoContent,
        videoContent
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}