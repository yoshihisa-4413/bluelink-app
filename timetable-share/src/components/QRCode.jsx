import { useState, useEffect } from 'react';
import { QrCode, Download, Share2, UserPlus, Loader2 } from 'lucide-react';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const QRCodeComponent = ({ user, onLogout }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/qr-code', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setQrData(data);
      } else {
        alert(data.error || 'QRコードの生成に失敗しました');
      }
    } catch (error) {
      alert('QRコードの生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData) return;
    
    const link = document.createElement('a');
    link.href = qrData.qr_code;
    link.download = `${qrData.username}_qr_code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareQRCode = async () => {
    if (!qrData) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BlueLink 友達追加QRコード',
          text: `${qrData.username}さんの友達追加QRコード`,
          url: `https://bluelink-app-lx59.onrender.com/add-friend/${qrData.user_id}`
        });
      } catch (error) {
        console.log('共有がキャンセルされました');
      }
    } else {
      // フォールバック: クリップボードにコピー
      const url = `https://bluelink-app-lx59.onrender.com/add-friend/${qrData.user_id}`;
      navigator.clipboard.writeText(url);
      alert('友達追加URLをクリップボードにコピーしました');
    }
  };

  const parseQRCode = async () => {
    if (!scanInput.trim()) return;
    
    // URLから友達IDを抽出
    const match = scanInput.match(/add-friend\/(\d+)/);
    if (!match) {
      alert('無効なQRコードです');
      return;
    }
    
    const friendId = match[1];
    
    setLoading(true);
    try {
      const response = await fetch(`https://bluelink-app-lx59.onrender.com/api/add-friend/${friendId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        setScanInput('');
      } else {
        alert(data.error || '友達申請の送信に失敗しました');
      }
    } catch (error) {
      alert('友達申請の送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">QRコード</h2>
          <p className="text-gray-600">QRコードで簡単に友達追加</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-center space-x-4">
                <Button
                  variant={!scanMode ? "default" : "outline"}
                  onClick={() => setScanMode(false)}
                >
                  マイQRコード
                </Button>
                <Button
                  variant={scanMode ? "default" : "outline"}
                  onClick={() => setScanMode(true)}
                >
                  QRスキャン
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!scanMode ? (
                /* マイQRコード表示 */
                <div className="space-y-6">
                  <div className="text-center">
                    <CardTitle className="mb-2">あなたのQRコード</CardTitle>
                    <CardDescription>
                      このQRコードを友達に見せて、簡単に友達追加してもらいましょう
                    </CardDescription>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : qrData ? (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <img 
                          src={qrData.qr_code} 
                          alt="QRコード" 
                          className="mx-auto mb-4 max-w-64 h-auto border rounded-lg"
                        />
                        <p className="text-lg font-medium text-gray-800">
                          {qrData.username}さんのQRコード
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          ID: {qrData.user_id}
                        </p>
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button
                          onClick={downloadQRCode}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          保存
                        </Button>
                        <Button
                          onClick={shareQRCode}
                          className="flex-1"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          共有
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">QRコードを生成できませんでした</p>
                      <Button onClick={generateQRCode}>
                        再試行
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* QRスキャン */
                <div className="space-y-6">
                  <div className="text-center">
                    <CardTitle className="mb-2">QRコードスキャン</CardTitle>
                    <CardDescription>
                      友達のQRコードのURLを入力して友達申請を送信
                    </CardDescription>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QRコードのURL
                      </label>
                      <Textarea
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="https://bluelink-app-lx59.onrender.com/add-friend/..."
                        rows={3}
                      />
                    </div>
                    
                    <Button
                      onClick={parseQRCode}
                      disabled={!scanInput.trim() || loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          送信中...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          友達申請を送信
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QRCodeComponent;

