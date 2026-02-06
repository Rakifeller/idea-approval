// app/api/approved-content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get content IDs that are already scheduled or posted
    const { data: scheduledPosts } = await supabase
      .from('scheduled_posts')
      .select('content_id')
      .in('status', ['scheduled', 'posting', 'posted'])

    const scheduledContentIds = (scheduledPosts || []).map(p => p.content_id)

    // Get approved content, excluding already scheduled ones
    let query = supabase
      .from('approved_content')
      .select('*')
      .order('created_at', { ascending: false })

    if (scheduledContentIds.length > 0) {
      query = query.not('id', 'in', `(${scheduledContentIds.join(',')})`)
    }

    const { data: content, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}