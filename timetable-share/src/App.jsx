import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import MyTimetable from './components/MyTimetable'
import FriendsList from './components/FriendsList'
import FriendSearch from './components/FriendSearch'
import QRCodeComponent from './components/QRCode'
import Messages from './components/Messages'
import Profile from './components/Profile'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ローカルストレージからユーザー情報を取得
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="/timetable" element={<MyTimetable user={user} onLogout={handleLogout} />} />
            <Route path="/friends" element={<FriendsList user={user} onLogout={handleLogout} />} />
            <Route path="/search" element={<FriendSearch user={user} onLogout={handleLogout} />} />
            <Route path="/qr" element={<QRCodeComponent user={user} onLogout={handleLogout} />} />
            <Route path="/messages" element={<Messages user={user} onLogout={handleLogout} />} />
            <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

export default App

