import { useState, useEffect } from 'react'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Calendar, BookOpen, QrCode, MessageCircle, User } from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentStatus, setCurrentStatus] = useState('空き時間')

  // 時間割の定義
  const timeSlots = [
    { period: 1, start: '08:45', end: '10:15', name: '1限' },
    { period: 2, start: '10:30', end: '12:00', name: '2限' },
    { period: 3, start: '13:00', end: '14:30', name: '3限' },
    { period: 4, start: '14:45', end: '16:15', name: '4限' },
    { period: 5, start: '16:30', end: '18:00', name: '5限' },
  ]

  // モックデータ
  const mockTimetable = {
    1: { 1: '数学', 3: '物理学', 5: '英語' }, // 月曜日
    2: { 2: '化学', 4: '歴史' }, // 火曜日
    3: { 1: '国語', 2: '体育', 4: '生物学' }, // 水曜日
    4: { 3: '地理', 5: '音楽' }, // 木曜日
    5: { 1: '美術', 2: '情報' }, // 金曜日
  }

  const mockFriends = [
    { id: 1, name: '田中太郎', status: '授業中', subject: '数学' },
    { id: 2, name: '佐藤花子', status: '空き時間', subject: null },
    { id: 3, name: '鈴木次郎', status: '授業中', subject: '英語' },
    { id: 4, name: '高橋美咲', status: '空き時間', subject: null },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // 現在の時刻から授業状況を判定
    const now = currentTime
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    const dayOfWeek = now.getDay() // 0=日曜日, 1=月曜日, ...

    let status = '空き時間'
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 平日のみ
      for (const slot of timeSlots) {
        if (currentTimeString >= slot.start && currentTimeString <= slot.end) {
          const todayClasses = mockTimetable[dayOfWeek]
          if (todayClasses && todayClasses[slot.period]) {
            status = `授業中 (${slot.name}: ${todayClasses[slot.period]})`
          }
          break
        }
      }
    }
    
    setCurrentStatus(status)
  }, [currentTime])

  const formatTime = (date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">ダッシュボード</h2>
          <p className="text-gray-600">現在の状況と友達の授業状況を確認できます</p>
        </div>

        {/* 現在の状況 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">現在時刻</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
              <p className="text-xs text-muted-foreground">{formatDate(currentTime)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">現在の状況</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                <Badge variant={currentStatus.includes('授業中') ? 'destructive' : 'secondary'}>
                  {currentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">友達数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockFriends.length}</div>
              <p className="text-xs text-muted-foreground">登録済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今週の授業</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">コマ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QRコード</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                to="/qr" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                友達追加用QR
              </Link>
              <p className="text-xs text-muted-foreground">簡単に友達追加</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">メッセージ</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                to="/messages" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                友達とチャット
              </Link>
              <p className="text-xs text-muted-foreground">リアルタイム会話</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">プロフィール</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                to="/profile" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                プロフィール編集
              </Link>
              <p className="text-xs text-muted-foreground">自己紹介を設定</p>
            </CardContent>
          </Card>
        </div>

        {/* 友達の状況 */}
        <Card>
          <CardHeader>
            <CardTitle>友達の現在の状況</CardTitle>
            <CardDescription>友達の授業状況をリアルタイムで確認</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{friend.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      {friend.subject && (
                        <p className="text-sm text-gray-600">{friend.subject}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={friend.status === '授業中' ? 'destructive' : 'secondary'}>
                    {friend.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default Dashboard

