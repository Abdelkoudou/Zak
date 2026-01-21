#!/usr/bin/env node

/**
 * Test Supabase email configuration
 * Usage: node scripts/test-email.mjs <email>
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const email = process.argv[2]

if (!email) {
  console.error('❌ Usage: node scripts/test-email.mjs <email>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('📧 Testing email configuration...')
console.log(`Sending password reset email to: ${email}`)

const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/auth/callback`,
})

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log('✅ Email sent successfully!')
console.log('Check your inbox for the password reset email.')
