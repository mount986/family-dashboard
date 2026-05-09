export type ProfileTheme = 'light' | 'dark'

export interface Profile {
  id: string
  name: string
  avatarUrl: string | null
  colorTheme: string
  theme: ProfileTheme
  /** Admin profiles require a PIN to switch to and can manage all profiles */
  isAdmin: boolean
  createdAt: string
}

/** Stripped-down shape returned in list endpoints — no sensitive fields */
export interface ProfileSummary {
  id: string
  name: string
  avatarUrl: string | null
  colorTheme: string
  theme: ProfileTheme
  isAdmin: boolean
}

export interface CreateProfileInput {
  name: string
  avatarUrl?: string
  colorTheme?: string
  theme?: ProfileTheme
  isAdmin?: boolean
  pin?: string
}

export interface UpdateProfileInput {
  name?: string
  avatarUrl?: string | null
  colorTheme?: string
  theme?: ProfileTheme
  isAdmin?: boolean
}

export interface SwitchProfileInput {
  profileId: string
  pin?: string
}

export interface ActiveSession {
  profileId: string
  profileName: string
  colorTheme: string
  theme: ProfileTheme
  isAdmin: boolean
}
