import AsnafpreneurLanding from '@/modules/asnafpreneur/page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ASNAFPRENEUR — Program Usahawan AI SaaS',
  description: 'Ubah masa depan anda dari asnaf kepada usahawan AI SaaS yang berjaya. Program tajaan penuh Hijrah Selangor & Bank Muamalat.',
}

export default function AsnafpreneurPage() {
  return <AsnafpreneurLanding />
}
