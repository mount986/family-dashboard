export interface Profile {
  id: string
  name: string
  avatarUrl: string | null
  colorTheme: string
  isPrivate: boolean
  createdAt: string
}

/** Stripped-down shape returned in list endpoints — no sensitive fields */
export interface ProfileSummary {
  id: string
  name: string
  avatarUrl: string | null
  colorTheme: string
  isPrivate: boolean
}

export interface CreateProfileInput {
  name: string
  avatarUrl?: string
  colorTheme?: string
  isPrivate?: boolean
  pin?: string
}

export interface UpdateProfileInput {
  name?: string
  avatarUrl?: string | null
  colorTheme?: string
  isPrivate?: boolean
}

export interface SwitchProfileInput {
  profileId: string
  pin?: string
}

export interface ActiveSession {
  profileId: string
  profileName: string
  isPrivate: boolean
}
