const sanitizeKey = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, '_')

const normalizeAlias = <T extends string>(
  value: string | null | undefined,
  aliases: Record<string, T>,
) => {
  if (!value) return undefined
  return aliases[sanitizeKey(value)]
}

export const MEMBER_STATUS_VALUES = ['active', 'inactive', 'blacklisted'] as const
export type MemberStatusValue = (typeof MEMBER_STATUS_VALUES)[number]

export const MEMBER_STATUS_LABELS: Record<MemberStatusValue, string> = {
  active: 'Aktif',
  inactive: 'Tidak Aktif',
  blacklisted: 'Senarai Hitam',
}

export const MARITAL_STATUS_VALUES = ['single', 'married', 'divorced', 'widowed'] as const
export type MaritalStatusValue = (typeof MARITAL_STATUS_VALUES)[number]

export const MARITAL_STATUS_LABELS: Record<MaritalStatusValue, string> = {
  single: 'Bujang',
  married: 'Berkahwin',
  divorced: 'Bercerai',
  widowed: 'Janda/Duda',
}

export const PROGRAMME_CATEGORY_VALUES = [
  'food_aid',
  'education',
  'skills_training',
  'healthcare',
  'financial_assistance',
  'community',
  'emergency_relief',
  'dawah',
] as const
export type ProgrammeCategoryValue = (typeof PROGRAMME_CATEGORY_VALUES)[number]

export const PROGRAMME_CATEGORY_LABELS: Record<ProgrammeCategoryValue, string> = {
  food_aid: 'Bantuan Makanan',
  education: 'Pendidikan',
  skills_training: 'Latihan Kemahiran',
  healthcare: 'Kesihatan',
  financial_assistance: 'Bantuan Kewangan',
  community: 'Komuniti',
  emergency_relief: 'Bantuan Kecemasan',
  dawah: 'Dakwah',
}

export const PROGRAMME_STATUS_VALUES = ['planned', 'active', 'completed', 'suspended'] as const
export type ProgrammeStatusValue = (typeof PROGRAMME_STATUS_VALUES)[number]

export const PROGRAMME_STATUS_LABELS: Record<ProgrammeStatusValue, string> = {
  planned: 'Dirancang',
  active: 'Aktif',
  completed: 'Siap',
  suspended: 'Ditangguh',
}

const MEMBER_STATUS_ALIASES: Record<string, MemberStatusValue> = {
  active: 'active',
  aktif: 'active',
  inactive: 'inactive',
  tidak_aktif: 'inactive',
  blacklisted: 'blacklisted',
  senarai_hitam: 'blacklisted',
  suspended: 'blacklisted',
}

const MARITAL_STATUS_ALIASES: Record<string, MaritalStatusValue> = {
  single: 'single',
  bujang: 'single',
  married: 'married',
  berkahwin: 'married',
  divorced: 'divorced',
  bercerai: 'divorced',
  widowed: 'widowed',
  janda_duda: 'widowed',
}

const PROGRAMME_CATEGORY_ALIASES: Record<string, ProgrammeCategoryValue> = {
  food_aid: 'food_aid',
  education: 'education',
  skills_training: 'skills_training',
  healthcare: 'healthcare',
  financial_assistance: 'financial_assistance',
  community: 'community',
  emergency_relief: 'emergency_relief',
  dawah: 'dawah',
  health: 'healthcare',
  social_welfare: 'community',
  community_development: 'community',
  economic_empowerment: 'skills_training',
  environment: 'community',
  other: 'community',
}

const PROGRAMME_STATUS_ALIASES: Record<string, ProgrammeStatusValue> = {
  planned: 'planned',
  dirancang: 'planned',
  draft: 'planned',
  active: 'active',
  aktif: 'active',
  completed: 'completed',
  siap: 'completed',
  suspended: 'suspended',
  ditangguh: 'suspended',
}

const PARTNER_TYPE_ALIASES: Record<string, string> = {
  government: 'government',
  corporate: 'corporate',
  ngo: 'ngo',
  academic: 'foundation',
  religious: 'masjid',
  healthcare: 'foundation',
  media: 'foundation',
  community: 'ngo',
  international: 'foundation',
  other: 'foundation',
  foundation: 'foundation',
  masjid: 'masjid',
  individual: 'individual',
}

const PARTNER_VERIFIED_STATUS_ALIASES: Record<string, string> = {
  claimed: 'claimed',
  unverified: 'claimed',
  pending: 'partner_confirmed',
  partner_confirmed: 'partner_confirmed',
  verified: 'publicly_verified',
  publicly_verified: 'publicly_verified',
}

export const normalizeMemberStatus = (value: string | null | undefined) =>
  normalizeAlias(value, MEMBER_STATUS_ALIASES)

export const normalizeMaritalStatus = (value: string | null | undefined) =>
  normalizeAlias(value, MARITAL_STATUS_ALIASES)

export const normalizeProgrammeCategory = (value: string | null | undefined) =>
  normalizeAlias(value, PROGRAMME_CATEGORY_ALIASES)

export const normalizeProgrammeStatus = (value: string | null | undefined) =>
  normalizeAlias(value, PROGRAMME_STATUS_ALIASES)

export const normalizePartnerType = (value: string | null | undefined) =>
  normalizeAlias(value, PARTNER_TYPE_ALIASES) ?? (value ? sanitizeKey(value) : undefined)

export const normalizePartnerRelationship = (value: string | null | undefined) =>
  value?.trim() || undefined

export const normalizePartnerVerifiedStatus = (value: string | null | undefined) =>
  normalizeAlias(value, PARTNER_VERIFIED_STATUS_ALIASES) ??
  (value ? sanitizeKey(value) : undefined)

export const getMemberStatusLabel = (value: string | null | undefined) => {
  const normalized = normalizeMemberStatus(value)
  return normalized ? MEMBER_STATUS_LABELS[normalized] : value || '-'
}

export const getMaritalStatusLabel = (value: string | null | undefined) => {
  const normalized = normalizeMaritalStatus(value)
  return normalized ? MARITAL_STATUS_LABELS[normalized] : value || '-'
}

export const getProgrammeStatusLabel = (value: string | null | undefined) => {
  const normalized = normalizeProgrammeStatus(value)
  return normalized ? PROGRAMME_STATUS_LABELS[normalized] : value || '-'
}

export const getProgrammeCategoryLabel = (value: string | null | undefined) => {
  const normalized = normalizeProgrammeCategory(value)
  return normalized ? PROGRAMME_CATEGORY_LABELS[normalized] : value || '-'
}
