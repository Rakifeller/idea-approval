export interface ContentIdea {
  id: string
  character_id: string
  source_id: string
  source_post_url: string
  idea_text: string
  inspiration_summary: string
  original_post_caption: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  rejected_at?: string
}

export interface InfluencerCharacter {
  id: string
  name: string
  niche: string
  personality_traits: Record<string, any>
  visual_style: Record<string, any>
  bio: string
  reference_image_url?: string
  // Physical attributes
  age?: number
  height_cm?: number
  weight_kg?: number
  ethnicity?: string
  hair_color?: string
  eye_color?: string
  skin_tone?: string
  body_type?: string
  created_at?: string
  updated_at?: string
}