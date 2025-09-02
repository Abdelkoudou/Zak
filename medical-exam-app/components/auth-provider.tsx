"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem("medexam-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock authentication - in real app, this would validate against a backend
    const users = JSON.parse(localStorage.getItem("medexam-users") || "[]")
    const existingUser = users.find((u: any) => u.email === email && u.password === password)

    if (existingUser) {
      const { password: _, ...userWithoutPassword } = existingUser
      setUser(userWithoutPassword)
      localStorage.setItem("medexam-user", JSON.stringify(userWithoutPassword))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock user creation
    const users = JSON.parse(localStorage.getItem("medexam-users") || "[]")
    const existingUser = users.find((u: any) => u.email === email)

    if (existingUser) {
      setIsLoading(false)
      return false // User already exists
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In real app, this would be hashed
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem("medexam-users", JSON.stringify(users))

    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem("medexam-user", JSON.stringify(userWithoutPassword))

    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("medexam-user")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
