'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function GameIntroPage() {
  const router = useRouter()

  const handleEnter = () => {
    router.push('/game')
  }

  const handleExit = () => {
    router.back()
  }

  return (
    <div className="w-full overflow-hidden min-h-screen relative scanline" style={{ background: '#0a0a0a' }}>
      {/* 배경 그리드 패턴 */}
      <div 
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* 배경 네온 효과 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#FF00FF' }} />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: '#00FFFF' }} />
      <div className="fixed top-1/2 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#00FF00' }} />

      <div className="relative z-10">
        {/* 입장 확인 화면 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center min-h-screen p-4"
        >
          <div className="text-center space-y-8 max-w-md">
            {/* 게임방 아이콘 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-8xl mb-4"
              style={{
                filter: 'drop-shadow(0 0 20px #00FFFF) drop-shadow(0 0 40px #00FFFF80)',
              }}
            >
              🕹️
            </motion.div>

            {/* 타이틀 */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-retro text-white text-display-s mb-2 neon-text"
              style={{ 
                color: '#00FFFF',
                textShadow: `
                  0 0 5px #00FFFF,
                  0 0 10px #00FFFF,
                  0 0 15px #00FFFF,
                  0 0 20px #00FFFF
                `
              }}
            >
              GAME ROOM
            </motion.h1>

            {/* 메시지 */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-retro text-white/90 text-body"
              style={{
                color: '#FFFFFF',
                letterSpacing: '0.05em',
              }}
            >
              게임방에 입장하시겠습니까?
            </motion.p>

            {/* 버튼들 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 pt-4"
            >
              <button
                onClick={handleExit}
                className="flex-1 py-4 px-6 rounded-lg border-2 transition-all duration-300 font-retro text-body hover:scale-105 active:scale-95"
                style={{
                  borderColor: '#FF00FF',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)',
                  color: '#FF00FF',
                  boxShadow: '0 0 10px #FF00FF40, 0 0 20px #FF00FF30',
                }}
              >
                취소
              </button>
              <button
                onClick={handleEnter}
                className="flex-1 py-4 px-6 rounded-lg border-2 transition-all duration-300 font-retro text-body font-bold hover:scale-105 active:scale-95"
                style={{
                  borderColor: '#00FFFF',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)',
                  color: '#00FFFF',
                  boxShadow: `
                    0 0 10px #00FFFF40,
                    0 0 20px #00FFFF30,
                    0 0 30px #00FFFF20,
                    inset 0 0 20px #00FFFF10
                  `,
                }}
              >
                입장
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


