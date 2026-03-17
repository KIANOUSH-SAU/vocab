import type { Field } from '@/types'

export interface FieldIcon {
  library: 'Ionicons' | 'MaterialCommunityIcons'
  name: string
}

export interface FieldMeta {
  id: Field
  label: string
  description: string
  color: string
  icon: FieldIcon
}

export const FIELDS: FieldMeta[] = [
  {
    id: 'engineering',
    label: 'Engineering',
    description: 'Technical, design & problem-solving vocabulary',
    color: '#3B82F6',
    icon: { library: 'MaterialCommunityIcons', name: 'cog-outline' },
  },
  {
    id: 'health',
    label: 'Health & Medicine',
    description: 'Medical, wellness & clinical vocabulary',
    color: '#10B981',
    icon: { library: 'MaterialCommunityIcons', name: 'heart-pulse' },
  },
  {
    id: 'law',
    label: 'Law',
    description: 'Legal, judicial & contractual vocabulary',
    color: '#8B5CF6',
    icon: { library: 'Ionicons', name: 'scale-outline' },
  },
  {
    id: 'sports',
    label: 'Sports',
    description: 'Athletic, coaching & performance vocabulary',
    color: '#F59E0B',
    icon: { library: 'Ionicons', name: 'trophy-outline' },
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Teaching, learning & academic vocabulary',
    color: '#EF4444',
    icon: { library: 'Ionicons', name: 'book-outline' },
  },
] as const
