import { useState, useEffect } from 'react'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Eye, Clock, BookOpen, MessageCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const FriendsList = ({ user, onLogout }) => {
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedFriendTimetable, setSelectedFriendTimetable] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timetableLoading, setTimetableLoading] = useState(false)

  const timeSlots = [
    { period: 1, start: '08:45', end: '10:15', name: '1限' },
    { period: 2, start: '10:30', end: '12:00', name: '2限' },
    { period: 3, start: '13:00', end: '14:30', name: '3限' },
    { period: 4, start: '14:45', end: '16:15', name: '4限' },
    { period: 5, start: '16:30', end: '18:00', name: '5限' },
  ]

  const daysOfWeek = [
    { id: 1, name: '月', fullName: '月曜日', key: 'monday' },
    { id: 2, name: '火', fullName: '火曜日', key: 'tuesday' },
    { id: 3, name: '水', fullName: '水曜日', key: 'wednesday' },
    { id: 4, name: '木', fullName: '木曜日', key: 'thursday' },
    { id: 5, name: '金', fullName: '金曜日', key: 'friday' },
  ]

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/friends', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends)
      } else {
        console.error('友達リストの取得に失敗しました')
      }
    } catch (error) {
      console.error('友達リストの取得中にエラーが発生しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFriendTimetable = async (friendId) => {
    setTimetableLoading(true)
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/timetable/user/${friendId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedFriendTimetable(data.timetables)
      } else {
        console.error('友達の時間割取得に失敗しました')
        setSelectedFriendTimetable([])
      }
    } catch (error) {
      console.error('友達の時間割取得中にエラーが発生しました:', error)
      setSelectedFriendTimetable([])
    } finally {
      setTimetableLoading(false)
    }
  }

  const handleViewTimetable = async (friend) => {
    setSelectedFriend(friend)
    setIsDialogOpen(true)
    await loadFriendTimetable(friend.id)
  }

  const getTimetableData = (dayKey, period) => {
    return selectedFriendTimetable.find(
      item => item.day_of_week === dayKey && item.period === period
    )
  }

  const getStatusBadge = (classStatus) => {
    if (classStatus.status === 'in_class') {
      return <Badge variant="destructive">授業中</Badge>
    } else {
      return <Badge variant="secondary">空き時間</Badge>
    }
  }

  const getStatusText = (classStatus) => {
    if (classStatus.status === 'in_class') {
      return '授業中'
    } else {
      return '空き時間'
    }
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">友達リストを読み込み中...</span>
          </div>
        </div>
      </Layout>
    )
  }

  const inClassCount = friends.filter(f => f.class_status?.status === 'in_class').length
  const freeCount = friends.filter(f => f.class_status?.status === 'free').length

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">友達リスト</h2>
          <p className="text-gray-600">友達の現在の授業状況を確認できます</p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">友達総数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{friends.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">授業中</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {inClassCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">空き時間</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {freeCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 友達リスト */}
        <Card>
          <CardHeader>
            <CardTitle>友達の現在の状況</CardTitle>
            <CardDescription>リアルタイムで友達の授業状況を確認</CardDescription>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">まだ友達がいません</h3>
                <p className="text-gray-500 mb-4">友達を検索して追加しましょう</p>
                <Link to="/friend-search">
                  <Button>友達を検索</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.username.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-lg">{friend.username}</p>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(friend.class_status)}
                          {friend.class_status?.status === 'in_class' && friend.class_status?.subject && (
                            <span className="text-sm text-gray-600">- {friend.class_status.subject}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link to="/messages">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          メッセージ
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTimetable(friend)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        時間割を見る
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 時間割表示ダイアログ */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFriend?.username}さんの時間割</DialogTitle>
              <DialogDescription>
                現在の状況: 
                {selectedFriend && getStatusBadge(selectedFriend.class_status)}
                {selectedFriend?.class_status?.status === 'in_class' && selectedFriend?.class_status?.subject && (
                  <span className="ml-2">- {selectedFriend.class_status.subject}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedFriend && (
              <div className="overflow-x-auto">
                {timetableLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>時間割を読み込み中...</span>
                    </div>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-50 text-sm font-medium">時限</th>
                        {daysOfWeek.map((day) => (
                          <th key={day.id} className="border p-2 bg-gray-50 text-sm font-medium min-w-32">
                            {day.fullName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot) => (
                        <tr key={slot.period}>
                          <td className="border p-2 bg-gray-50 text-sm">
                            <div className="text-center">
                              <div className="font-medium">{slot.name}</div>
                              <div className="text-xs text-gray-500">
                                {slot.start}-{slot.end}
                              </div>
                            </div>
                          </td>
                          {daysOfWeek.map((day) => {
                            const classData = getTimetableData(day.key, slot.period)
                            return (
                              <td key={`${day.id}-${slot.period}`} className="border p-1">
                                {classData ? (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2 min-h-16">
                                    <div className="text-sm font-medium text-blue-900">{classData.subject_name}</div>
                                    {classData.room && (
                                      <div className="text-xs text-blue-700">{classData.room}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="min-h-16 flex items-center justify-center text-gray-400 text-sm">
                                    空き
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default FriendsList

