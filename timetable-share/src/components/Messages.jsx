import { useState, useEffect } from 'react';
import { MessageCircle, Send, ArrowLeft, User, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Layout from './Layout';

const Messages = ({ user, onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/conversations', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations);
      } else {
        console.error('会話の取得に失敗:', data.error);
      }
    } catch (error) {
      console.error('会話の取得中にエラー:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/conversations/${conversationId}/messages`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages);
      } else {
        console.error('メッセージの取得に失敗:', data.error);
      }
    } catch (error) {
      console.error('メッセージの取得中にエラー:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/unread-count', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('未読数の取得中にエラー:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        // 友達のみをフィルタリング
        const friends = data.users.filter(user => user.friendship_status === 'friends');
        setSearchResults(friends);
      } else {
        console.error('ユーザー検索に失敗:', data.error);
      }
    } catch (error) {
      console.error('ユーザー検索中にエラー:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const startConversation = async (friendUserId) => {
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/conversations/${friendUserId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setSelectedConversation(data.conversation);
        setIsNewMessageDialogOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        await loadConversations(); // 会話リストを更新
      } else {
        alert(data.error || '会話の作成に失敗しました');
      }
    } catch (error) {
      alert('会話の作成中にエラーが発生しました');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: newMessage })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        loadConversations(); // 会話リストを更新
      } else {
        alert(data.error || 'メッセージの送信に失敗しました');
      }
    } catch (error) {
      alert('メッセージの送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">メッセージ</h2>
            <p className="text-gray-600">友達とのメッセージ</p>
            {unreadCount > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                未読 {unreadCount} 件
              </span>
            )}
          </div>
          <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新規メッセージ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規メッセージ</DialogTitle>
                <DialogDescription>
                  メッセージを送信する友達を検索してください
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="友達の名前を検索..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
                
                {searchLoading && (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500">検索中...</div>
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => startConversation(friend.id)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{friend.username}</p>
                          <p className="text-sm text-gray-500">{friend.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchQuery && !searchLoading && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500">友達が見つかりませんでした</div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* 会話リスト */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>会話</CardTitle>
                <CardDescription>友達とのメッセージ履歴</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>まだ会話がありません</p>
                      <p className="text-sm">友達とメッセージを始めましょう</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {conversation.other_user.username}
                            </p>
                            {conversation.last_message && (
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.last_message.content}
                              </p>
                            )}
                          </div>
                          {conversation.last_message && (
                            <div className="text-xs text-gray-400">
                              {formatDate(conversation.last_message.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メッセージ表示エリア */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.other_user.username}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                {/* メッセージ一覧 */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user.id
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* メッセージ入力 */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="メッセージを入力..."
                      disabled={loading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || loading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">会話を選択してください</h3>
                  <p>左側の会話リストから友達を選んでメッセージを始めましょう</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;

