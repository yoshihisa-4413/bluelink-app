import { useState, useEffect } from 'react';
import { User, Edit3, Save, X, Camera, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Profile = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    grade: '',
    department: '',
    hobbies: '',
    is_public: true
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setFormData({
          bio: data.profile.bio || '',
          grade: data.profile.grade || '',
          department: data.profile.department || '',
          hobbies: data.profile.hobbies || '',
          is_public: data.profile.is_public !== false
        });
      } else {
        console.error('プロフィールの取得に失敗:', data.error);
      }
    } catch (error) {
      console.error('プロフィールの取得中にエラー:', error);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setIsEditing(false);
        alert('プロフィールを更新しました');
      } else {
        alert(data.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      alert('プロフィールの更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ avatar_type: 'default' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        loadProfile(); // プロフィールを再読み込み
        alert('アバターを更新しました');
      } else {
        alert(data.error || 'アバターの更新に失敗しました');
      }
    } catch (error) {
      alert('アバターの更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        grade: profile.grade || '',
        department: profile.department || '',
        hobbies: profile.hobbies || '',
        is_public: profile.is_public !== false
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <User className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">BlueLink プロフィール</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">こんにちは、{user.username}さん</span>
              <Button onClick={onLogout} variant="outline" size="sm">
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* プロフィール基本情報 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>基本情報</CardTitle>
                  <CardDescription>あなたのプロフィール情報</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={profile.is_public ? 'default' : 'secondary'}>
                    {profile.is_public ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        公開
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        非公開
                      </>
                    )}
                  </Badge>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={updateProfile} disabled={loading} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        キャンセル
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* アバター */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="プロフィール画像"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-600" />
                    </div>
                  )}
                  {isEditing && (
                    <button
                      onClick={generateAvatar}
                      disabled={loading}
                      className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{profile.username}</h3>
                  <p className="text-sm text-gray-500">@{profile.username}</p>
                </div>
              </div>

              {/* プロフィール詳細 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学年
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      <option value="1年生">1年生</option>
                      <option value="2年生">2年生</option>
                      <option value="3年生">3年生</option>
                      <option value="4年生">4年生</option>
                      <option value="大学院生">大学院生</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.grade || '未設定'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学部・学科
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="例: 工学部情報工学科"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.department || '未設定'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自己紹介
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="自己紹介を書いてください..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {profile.bio || '自己紹介が設定されていません'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  趣味・興味
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.hobbies}
                    onChange={(e) => handleInputChange('hobbies', e.target.value)}
                    placeholder="趣味や興味のあることを書いてください..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {profile.hobbies || '趣味・興味が設定されていません'}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">
                    プロフィールを公開する（友達以外にも表示されます）
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle>統計情報</CardTitle>
              <CardDescription>あなたのアクティビティ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">友達数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">送信メッセージ</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">登録授業数</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

