'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import StreamList from '@/components/StreamList'
import Link from 'next/link'

export default function Home() {
  const [activeTab, setActiveTab] = useState('trending')
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <main className="min-h-screen bg-primary-900">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Live Streams</h1>
          <Link
            href="/create"
            className="bg-secondary-500 text-white px-6 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
          >
            Stream erstellen
          </Link>
        </div>
        <StreamList />
      </div>
    </main>
  )
}

const features = [
  {
    icon: '🎥',
    title: 'Multi-Guest Streaming',
    description: 'Lade bis zu 8 Gäste in deinen Stream ein und interagiere in Echtzeit.',
  },
  {
    icon: '🤖',
    title: 'KI-gestützte Analyse',
    description: 'Erhalte wertvolle Einblicke und Optimierungsvorschläge für deine Streams.',
  },
  {
    icon: '🎮',
    title: 'Interaktive Features',
    description: 'Neue Match-Systeme und interaktive Elemente für mehr Engagement.',
  },
]

const tabs = ['Trending', 'Neu', 'Beliebt']

const streams = [
  {
    id: 1,
    title: 'Gaming Stream',
    viewerCount: 1234,
  },
  {
    id: 2,
    title: 'Kunst Stream',
    viewerCount: 856,
  },
  {
    id: 3,
    title: 'Musik Stream',
    viewerCount: 2341,
  },
  {
    id: 4,
    title: 'Just Chatting',
    viewerCount: 567,
  },
  {
    id: 5,
    title: 'Kochen Stream',
    viewerCount: 789,
  },
  {
    id: 6,
    title: 'Fitness Stream',
    viewerCount: 432,
  },
] 