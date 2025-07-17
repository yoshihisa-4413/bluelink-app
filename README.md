# 🎓 BlueLink - 大学生向け時間割シェアアプリ

![BlueLink](https://img.shields.io/badge/BlueLink-時間割シェア-blue)
![Version](https://img.shields.io/badge/version-3.0-green)
![Status](https://img.shields.io/badge/status-完全動作-success)

## 📱 アプリ概要

**BlueLink**は、大学生が友達の授業状況を一目で確認できるWebアプリです。

**「今、友達は授業中？空いてる？」**
そんな疑問を瞬時に解決します！

## ✨ 主な機能

### 🔐 ユーザー機能
- ✅ ユーザー登録・ログイン
- ✅ プロフィール管理

### 📅 時間割機能
- ✅ 時間割の登録・編集・削除
- ✅ 授業詳細（教室、教授名）
- ✅ リアルタイム保存

### 👥 友達機能
- ✅ 友達検索・追加
- ✅ 友達申請の送信・承認・拒否
- ✅ QRコードによる友達追加
- ✅ 友達の現在の授業状況をリアルタイム表示

### 💬 メッセージ機能
- ✅ 友達とのチャット
- ✅ リアルタイムメッセージ

## 🛠️ 技術構成

### フロントエンド
- **React** + **Vite**
- **Tailwind CSS**
- **Lucide React**

### バックエンド
- **Flask** (Python)
- **SQLite** (データベース)
- **Flask-SQLAlchemy**
- **Flask-CORS**

## 🚀 使い方

### 1. ローカル実行

#### バックエンド起動
```bash
cd timetable-api
pip install -r requirements.txt
python src/main.py
```

#### フロントエンド起動
```bash
cd timetable-share
npm install
npm run dev
```

### 2. アクセス
- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:5000

## 📁 プロジェクト構造

```
bluelink-app/
├── timetable-api/          # バックエンド
│   ├── src/
│   │   ├── main.py         # メインアプリ
│   │   ├── models/         # データベースモデル
│   │   └── routes/         # APIルート
│   └── requirements.txt    # Python依存関係
├── timetable-share/        # フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   └── App.jsx         # メインアプリ
│   └── package.json        # Node.js依存関係
└── README.md               # このファイル
```

## 🎯 使用手順

### 1. アカウント作成
1. アプリにアクセス
2. 新規登録でアカウント作成

### 2. 時間割登録
1. 「マイ時間割」で授業を追加
2. 授業名、教室、教授名を入力

### 3. 友達追加
1. 「友達検索」でユーザー検索
2. 友達申請を送信
3. QRコードでも追加可能

### 4. 授業状況確認
1. ダッシュボードで友達の状況確認
2. 🔴授業中 / 🟢空き時間 をリアルタイム表示

## 📊 システム仕様

- **対応人数**: 100人程度
- **データベース**: SQLite
- **認証**: セッション認証
- **デザイン**: レスポンシブ対応

## 🔒 セキュリティ

- パスワードハッシュ化
- セッション管理
- SQLインジェクション対策
- CORS設定

## 🚀 今後の予定

- [ ] プッシュ通知
- [ ] リマインダー機能
- [ ] グループチャット
- [ ] モバイルアプリ化

## 📄 ライセンス

MIT License

---

**BlueLink** - 友達の授業状況を一目で確認 🎓

