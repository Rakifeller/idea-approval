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
    if (!content_id || !character_id || !post_type || !scheduled_time || !media_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert scheduled post — if post_now, set status to 'posting'
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content_id,
        character_id,
        post_type,
        scheduled_time,
        caption,
        hashtags,
        media_url,
        media_type,
        status: post_now ? 'posting' : 'scheduled'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If post_now, trigger n8n webhook for immediate posting
    if (post_now && data) {
      const webhookUrl = process.env.N8N_POST_NOW_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
      
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trigger: 'post_now',
              scheduled_post_id: data.id,
              content_id,
              character_id,
              post_type,
              caption,
              hashtags,
              media_url,
              media_type,
              timestamp: new Date().toISOString()
            })
          })
        } catch (webhookError) {
          console.error('Webhook trigger failed:', webhookError)
          // Don't fail the request — post is saved, webhook can be retried
        }
      } else {
        console.warn('No webhook URL configured for post_now')
      }
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

    // Get all scheduled posts with character info
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