#!/usr/bin/env node

/**
 * Migration script to update existing device sessions to use unified device IDs
 * This helps transition from the old system where mobile and web had different IDs
 * to the new unified system where the same device gets the same ID
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '..', '.env.local') // Go up one directory to db-interface root
    const envFile = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        envVars[key.trim()] = value.replace(/^["']|["']$/g, '') // Remove quotes
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Could not load .env.local file:', error.message)
    return {}
  }
}

const env = loadEnvFile()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Analyze existing device sessions to find potential duplicates
 */
async function analyzeDeviceSessions() {
  console.log('🔍 Analyzing existing device sessions...')
  
  const { data: sessions, error } = await supabase
    .from('device_sessions')
    .select('*')
    .order('user_id', { ascending: true })
  
  if (error) {
    console.error('❌ Error fetching device sessions:', error.message)
    return
  }
  
  console.log(`📊 Found ${sessions.length} total device sessions`)
  
  // Group by user
  const userSessions = {}
  sessions.forEach(session => {
    if (!userSessions[session.user_id]) {
      userSessions[session.user_id] = []
    }
    userSessions[session.user_id].push(session)
  })
  
  // Find users with multiple sessions
  const usersWithMultipleSessions = Object.entries(userSessions)
    .filter(([userId, sessions]) => sessions.length > 1)
  
  console.log(`👥 Users with multiple device sessions: ${usersWithMultipleSessions.length}`)
  
  // Analyze potential duplicates
  let potentialDuplicates = 0
  usersWithMultipleSessions.forEach(([userId, sessions]) => {
    console.log(`\n👤 User ${userId}:`)
    sessions.forEach(session => {
      console.log(`  📱 ${session.device_id} - ${session.device_name} (${new Date(session.last_active_at).toLocaleDateString()})`)
    })
    
    // Look for sessions that might be from the same device
    const webSessions = sessions.filter(s => s.device_id.startsWith('web-'))
    const mobileSessions = sessions.filter(s => s.device_id.startsWith('mobile-') || !s.device_id.includes('-'))
    
    if (webSessions.length > 0 && mobileSessions.length > 0) {
      console.log(`  ⚠️  Potential duplicate: ${webSessions.length} web + ${mobileSessions.length} mobile sessions`)
      potentialDuplicates++
    }
  })
  
  console.log(`\n📈 Summary:`)
  console.log(`  Total sessions: ${sessions.length}`)
  console.log(`  Users with multiple sessions: ${usersWithMultipleSessions.length}`)
  console.log(`  Potential duplicates: ${potentialDuplicates}`)
}

/**
 * Clean up duplicate sessions (interactive)
 */
async function cleanupDuplicates() {
  console.log('\n🧹 Starting cleanup process...')
  
  const { data: sessions, error } = await supabase
    .from('device_sessions')
    .select('*')
    .order('user_id', { ascending: true })
  
  if (error) {
    console.error('❌ Error fetching device sessions:', error.message)
    return
  }
  
  // Group by user
  const userSessions = {}
  sessions.forEach(session => {
    if (!userSessions[session.user_id]) {
      userSessions[session.user_id] = []
    }
    userSessions[session.user_id].push(session)
  })
  
  // Find users with more than 2 sessions (over the limit)
  const usersOverLimit = Object.entries(userSessions)
    .filter(([userId, sessions]) => sessions.length > 2)
  
  console.log(`🚨 Found ${usersOverLimit.length} users over the 2-device limit`)
  
  for (const [userId, sessions] of usersOverLimit) {
    console.log(`\n👤 User ${userId} has ${sessions.length} sessions:`)
    sessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ${session.device_id} - ${session.device_name} (last active: ${new Date(session.last_active_at).toLocaleDateString()})`)
    })
    
    // Keep the 2 most recently active sessions
    const sortedSessions = sessions.sort((a, b) => new Date(b.last_active_at) - new Date(a.last_active_at))
    const sessionsToKeep = sortedSessions.slice(0, 2)
    const sessionsToDelete = sortedSessions.slice(2)
    
    if (sessionsToDelete.length > 0) {
      console.log(`  🗑️  Will delete ${sessionsToDelete.length} oldest sessions`)
      
      for (const session of sessionsToDelete) {
        const { error: deleteError } = await supabase
          .from('device_sessions')
          .delete()
          .eq('id', session.id)
        
        if (deleteError) {
          console.error(`    ❌ Error deleting session ${session.id}:`, deleteError.message)
        } else {
          console.log(`    ✅ Deleted session: ${session.device_id}`)
        }
      }
    }
  }
  
  console.log('\n✅ Cleanup completed!')
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'analyze':
      await analyzeDeviceSessions()
      break
    case 'cleanup':
      await cleanupDuplicates()
      break
    default:
      console.log('📋 Device Sessions Migration Tool')
      console.log('')
      console.log('Usage:')
      console.log('  node migrate-device-sessions.mjs analyze  - Analyze existing sessions')
      console.log('  node migrate-device-sessions.mjs cleanup  - Clean up duplicate sessions')
      console.log('')
      console.log('Run "analyze" first to see what needs to be cleaned up.')
      break
  }
}

main().catch(console.error)