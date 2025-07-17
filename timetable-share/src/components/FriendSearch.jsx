import { useState, useEffect } from 'react'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Check, X, Clock, Loader2, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'

const FriendSearch = ({ user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(true)

  useEffect(() => {
    loadFriendRequests()
  }, [])

  const loadFriendRequests = async () => {
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/friend-requests', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFriendRequests(data.received_requests)
        setSentRequests(data.sent_requests)
      } else {
        console.error('友達申請の取得に失敗しました')
      }
    } catch (error) {
      console.error('友達申請の取得中にエラーが発生しました:', error)
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      } else {
        console.error('ユーザー検索に失敗しました')
        setSearchResults([])
      }
    } catch (error) {
      console.error('ユーザー検索中にエラーが発生しました:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async (targetUserId) => {
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: targetUserId })
      })
      
      if (response.ok) {
        // 検索結果を更新
        setSearchResults(searchResults.map(user => 
          user.id === targetUserId 
            ? { ...user, friendship_status: 'sent' }
            : user
        ))
        // 友達申請リストを再読み込み
        await loadFriendRequests()
      } else {
        const data = await response.json()
        alert(data.error || '友達申請の送信に失敗しました')
      }
    } catch (error) {
      console.error('友達申請の送信中にエラーが発生しました:', error)
      alert('友達申請の送信中にエラーが発生しました')
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/friend-request/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // 友達申請リストを再読み込み
        await loadFriendRequests()
      } else {
        const data = await response.json()
        alert(data.error || '友達申請の承認に失敗しました')
      }
    } catch (error) {
      console.error('友達申請の承認中にエラーが発生しました:', error)
      alert('友達申請の承認中にエラーが発生しました')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/friend-request/${requestId}/reject`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // 友達申請リストを再読み込み
        await loadFriendRequests()
      } else {
        const data = await response.json()
        alert(data.error || '友達申請の拒否に失敗しました')
      }
    } catch (error) {
      console.error('友達申請の拒否中にエラーが発生しました:', error)
      alert('友達申請の拒否中にエラーが発生しました')
    }
  }

  const getFriendshipStatusBadge = (status) => {
    switch (status) {
      case 'friends':
        return <Badge variant="secondary">友達</Badge>
      case 'sent':
        return <Badge variant="outline">申請済み</Badge>
      case 'received':
        return <Badge variant="outline">申請受信</Badge>
      default:
        return null
    }
  }

  const canSendRequest = (friendshipStatus) => {
    return friendshipStatus === 'none'
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">友達検索</h2>
            <p className="text-gray-600">新しい友達を見つけて追加しましょう</p>
          </div>
          <Link to="/qr-code">
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QRコード
            </Button>
          </Link>
        </div>

        {/* 検索セクション */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー検索</CardTitle>
            <CardDescription>ユーザー名またはメールアドレスで検索</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="ユーザー名またはメールアドレスを入力..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 検索結果 */}
            {searchResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium">検索結果</h3>
                {searchResults.map((searchUser) => (
                  <div key={searchUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {searchUser.username.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{searchUser.username}</p>
                        <p className="text-sm text-gray-500">{searchUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getFriendshipStatusBadge(searchUser.friendship_status)}
                      {canSendRequest(searchUser.friendship_status) && (
                        <Button
                          size="sm"
                          onClick={() => handleSendFriendRequest(searchUser.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          友達申請
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && !loading && searchResults.length === 0 && (
              <div className="mt-6 text-center text-gray-500">
                <p>ユーザーが見つかりませんでした</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 友達申請セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 受信した申請 */}
          <Card>
            <CardHeader>
              <CardTitle>受信した友達申請</CardTitle>
              <CardDescription>あなたに送られた友達申請</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>新しい友達申請はありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {request.user.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{request.user.username}</p>
                          <p className="text-sm text-gray-500">{request.user.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 送信した申請 */}
          <Card>
            <CardHeader>
              <CardTitle>送信した友達申請</CardTitle>
              <CardDescription>あなたが送った友達申請</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>送信した友達申請はありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                          {request.user.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{request.user.username}</p>
                          <p className="text-sm text-gray-500">{request.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        承認待ち
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default FriendSearch

