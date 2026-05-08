export type GroceryCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'household'
  | 'other'

export interface GroceryItem {
  id: string
  name: string
  category: GroceryCategory
  quantity: string | null
  addedBy: string
  isChecked: boolean
  createdAt: string
}

export interface CreateGroceryItemInput {
  name: string
  category?: GroceryCategory
  quantity?: string
}

export interface UpdateGroceryItemInput {
  name?: string
  category?: GroceryCategory
  quantity?: string | null
  isChecked?: boolean
}
