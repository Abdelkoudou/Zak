import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const { data: sessions, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fingerprint } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    // Get existing sessions for this user
    const { data: sessions, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Look for similar device based on fingerprint characteristics
    // This is a simple implementation - you could make it more sophisticated
    let matchingDeviceId = null
    
    if (fingerprint && sessions) {
      // Extract key characteristics from fingerprint
      const fpParts = fingerprint.split('|')
      const osName = fpParts[0]
      const screenRes = fpParts[1]
      
      // Look for existing sessions with similar characteristics
      for (const session of sessions) {
        const deviceId = session.device_id
        
        // Check if this might be the same device accessed via different platform
        if (deviceId.includes(osName.toLowerCase()) || deviceId.includes(screenRes)) {
          matchingDeviceId = deviceId
          break
        }
      }
    }
    
    return NextResponse.json({ matchingDeviceId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}