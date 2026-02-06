// app/api/schedule-post/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      content_id,
      character_id,
      post_type,
      scheduled_time,
      caption,
      hashtags,
      media_url,
      media_type,
      post_now
    } = body

    // Validate required fields
    if (!content_id || !character_id || !post_type || !media_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // post_now → scheduled_time = now, so the cron job picks it up immediately
    const finalScheduledTime = post_now
      ? new Date().toISOString()
      : scheduled_time

    if (!finalScheduledTime) {
      return NextResponse.json(
        { error: 'scheduled_time is required for scheduling' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content_id,
        character_id,
        post_type,
        scheduled_time: finalScheduledTime,
        caption,
        hashtags,
        media_url,
        media_type,
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      scheduled_post: data,
      posted_immediately: !!post_now
    })
  } catch (error: any) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        character:influencer_characters(id, name, niche)
      `)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ scheduled_posts: data || [] })
  } catch (error: any) {
    console.error('Get scheduled posts error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}