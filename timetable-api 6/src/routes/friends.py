from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from src.models.friend import Friend
from src.models.timetable import Timetable
from datetime import datetime, time
import qrcode
import io
import base64

friends_bp = Blueprint('friends', __name__)

def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def get_current_class_status(user_id):
    """現在の授業状況を取得"""
    now = datetime.now()
    current_time = now.time()
    current_day_name = now.strftime('%A').lower()  # monday, tuesday, etc.
    
    # 曜日を整数に変換
    day_map = {
        'monday': 0,
        'tuesday': 1,
        'wednesday': 2,
        'thursday': 3,
        'friday': 4,
        'saturday': 5,
        'sunday': 6
    }
    
    current_day = day_map.get(current_day_name)
    if current_day is None or current_day > 4:  # 土日は授業なし
        return {'status': 'free'}
    
    # 時間割を取得
    current_classes = Timetable.query.filter(
        Timetable.user_id == user_id,
        Timetable.day_of_week == current_day
    ).all()
    
    # 現在時刻が授業時間内かチェック
    for class_item in current_classes:
        if class_item.start_time <= current_time <= class_item.end_time:
            return {
                'status': 'in_class',
                'subject': class_item.subject_name,
                'location': class_item.room,
                'end_time': class_item.end_time.strftime('%H:%M')
            }
    
    return {'status': 'free'}

@friends_bp.route('/friends', methods=['GET'])
def get_friends():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 承認済みの友達を取得
        friends_query = db.session.query(Friend, User).join(
            User, 
            (Friend.friend_user_id == User.id) | (Friend.user_id == User.id)
        ).filter(
            ((Friend.user_id == user.id) | (Friend.friend_user_id == user.id)) &
            (Friend.status == 'accepted') &
            (User.id != user.id)
        ).all()
        
        friends_list = []
        for friend_rel, friend_user in friends_query:
            # 現在の授業状況を取得
            class_status = get_current_class_status(friend_user.id)
            
            friends_list.append({
                'id': friend_user.id,
                'username': friend_user.username,
                'email': friend_user.email,
                'class_status': class_status,
                'friendship_id': friend_rel.id
            })
        
        # 空き時間の友達を上に表示
        friends_list.sort(key=lambda x: x['class_status']['status'] != 'free')
        
        return jsonify({'friends': friends_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/friend-requests', methods=['GET'])
def get_friend_requests():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 受信した友達申請を取得
        received_requests = db.session.query(Friend, User).join(
            User, Friend.user_id == User.id
        ).filter(
            Friend.friend_user_id == user.id,
            Friend.status == 'pending'
        ).all()
        
        # 送信した友達申請を取得
        sent_requests = db.session.query(Friend, User).join(
            User, Friend.friend_user_id == User.id
        ).filter(
            Friend.user_id == user.id,
            Friend.status == 'pending'
        ).all()
        
        return jsonify({
            'received_requests': [
                {
                    'id': req.id,
                    'user': {
                        'id': req_user.id,
                        'username': req_user.username,
                        'email': req_user.email
                    },
                    'created_at': req.created_at.isoformat()
                }
                for req, req_user in received_requests
            ],
            'sent_requests': [
                {
                    'id': req.id,
                    'user': {
                        'id': req_user.id,
                        'username': req_user.username,
                        'email': req_user.email
                    },
                    'created_at': req.created_at.isoformat()
                }
                for req, req_user in sent_requests
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/users/search', methods=['GET'])
def search_users():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'users': []}), 200
        
        # ユーザー名またはメールアドレスで検索
        users = User.query.filter(
            (User.username.ilike(f'%{query}%')) | (User.email.ilike(f'%{query}%'))
        ).filter(User.id != user.id).limit(20).all()
        
        # 既存の友達関係をチェック
        user_list = []
        for search_user in users:
            # 友達関係の状態を確認
            friendship = Friend.query.filter(
                ((Friend.user_id == user.id) & (Friend.friend_user_id == search_user.id)) |
                ((Friend.user_id == search_user.id) & (Friend.friend_user_id == user.id))
            ).first()
            
            friendship_status = 'none'
            if friendship:
                if friendship.status == 'accepted':
                    friendship_status = 'friends'
                elif friendship.status == 'pending':
                    if friendship.user_id == user.id:
                        friendship_status = 'sent'
                    else:
                        friendship_status = 'received'
            
            user_list.append({
                'id': search_user.id,
                'username': search_user.username,
                'email': search_user.email,
                'friendship_status': friendship_status
            })
        
        return jsonify({'users': user_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/friend-request', methods=['POST'])
def send_friend_request():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        data = request.get_json()
        friend_user_id = data.get('user_id')
        
        if not friend_user_id:
            return jsonify({'error': 'ユーザーIDが必要です'}), 400
        
        if friend_user_id == user.id:
            return jsonify({'error': '自分自身に友達申請はできません'}), 400
        
        # 対象ユーザーの存在確認
        friend_user = User.query.get(friend_user_id)
        if not friend_user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        
        # 既存の友達関係をチェック
        existing_friendship = Friend.query.filter(
            ((Friend.user_id == user.id) & (Friend.friend_user_id == friend_user_id)) |
            ((Friend.user_id == friend_user_id) & (Friend.friend_user_id == user.id))
        ).first()
        
        if existing_friendship:
            if existing_friendship.status == 'accepted':
                return jsonify({'error': '既に友達です'}), 400
            elif existing_friendship.status == 'pending':
                return jsonify({'error': '既に友達申請が送信されています'}), 400
        
        # 友達申請を作成
        friend_request = Friend(
            user_id=user.id,
            friend_user_id=friend_user_id,
            status='pending'
        )
        
        db.session.add(friend_request)
        db.session.commit()
        
        return jsonify({'message': '友達申請を送信しました'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/friend-request/<int:request_id>/accept', methods=['POST'])
def accept_friend_request(request_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 友達申請を取得
        friend_request = Friend.query.filter(
            Friend.id == request_id,
            Friend.friend_user_id == user.id,
            Friend.status == 'pending'
        ).first()
        
        if not friend_request:
            return jsonify({'error': '友達申請が見つかりません'}), 404
        
        # 申請を承認
        friend_request.status = 'accepted'
        db.session.commit()
        
        return jsonify({'message': '友達申請を承認しました'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/friend-request/<int:request_id>/reject', methods=['POST'])
def reject_friend_request(request_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 友達申請を取得
        friend_request = Friend.query.filter(
            Friend.id == request_id,
            Friend.friend_user_id == user.id,
            Friend.status == 'pending'
        ).first()
        
        if not friend_request:
            return jsonify({'error': '友達申請が見つかりません'}), 404
        
        # 申請を削除
        db.session.delete(friend_request)
        db.session.commit()
        
        return jsonify({'message': '友達申請を拒否しました'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/qr-code', methods=['GET'])
def generate_qr_code():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # QRコードのデータ（ユーザーIDを含むURL）
        qr_data = f"https://bluelink-app-lx59.onrender.com/add-friend/{user.id}"
        
        # QRコードを生成
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # 画像を生成
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Base64エンコード
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'qr_code': f"data:image/png;base64,{qr_code_base64}",
            'user_id': user.id,
            'username': user.username
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@friends_bp.route('/add-friend/<int:user_id>', methods=['POST'])
def add_friend_by_qr(user_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        if user_id == user.id:
            return jsonify({'error': '自分自身を友達に追加することはできません'}), 400
        
        # 対象ユーザーの存在確認
        friend_user = User.query.get(user_id)
        if not friend_user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        
        # 既存の友達関係をチェック
        existing_friendship = Friend.query.filter(
            ((Friend.user_id == user.id) & (Friend.friend_user_id == user_id)) |
            ((Friend.user_id == user_id) & (Friend.friend_user_id == user.id))
        ).first()
        
        if existing_friendship:
            if existing_friendship.status == 'accepted':
                return jsonify({'error': '既に友達です'}), 400
            elif existing_friendship.status == 'pending':
                return jsonify({'error': '既に友達申請が送信されています'}), 400
        
        # 友達申請を作成
        friend_request = Friend(
            user_id=user.id,
            friend_user_id=user_id,
            status='pending'
        )
        
        db.session.add(friend_request)
        db.session.commit()
        
        return jsonify({
            'message': f'{friend_user.username}さんに友達申請を送信しました',
            'friend_user': {
                'id': friend_user.id,
                'username': friend_user.username
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

