from flask import Blueprint, request, jsonify, session, url_for
from src.models.user import User, db
from src.models.friend import Friend
import qrcode
import io
import base64

qr_bp = Blueprint('qr', __name__)

def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

@qr_bp.route('/qr/generate', methods=['GET'])
def generate_qr_code():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # QRコードに含めるデータ（ユーザーIDとユーザー名）
        qr_data = f"timetable-share://add-friend/{user.id}"
        
        # QRコードを生成
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # QRコード画像を生成
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 画像をBase64エンコード
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        return jsonify({
            'qr_code': f"data:image/png;base64,{img_base64}",
            'qr_data': qr_data,
            'user_info': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@qr_bp.route('/qr/add-friend/<user_id>', methods=['POST'])
def add_friend_by_qr(user_id):
    current_user = require_auth()
    if not current_user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        if user_id == current_user.id:
            return jsonify({'error': '自分自身に友達申請はできません'}), 400
        
        # 対象ユーザーの存在確認
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        
        # 既存の関係をチェック
        existing = Friend.query.filter(
            ((Friend.user_id == current_user.id) & (Friend.friend_user_id == user_id)) |
            ((Friend.user_id == user_id) & (Friend.friend_user_id == current_user.id))
        ).first()
        
        if existing:
            if existing.status == 'accepted':
                return jsonify({'error': '既に友達です'}), 400
            elif existing.status == 'pending':
                return jsonify({'error': '既に友達申請が存在します'}), 400
        
        # 友達申請を作成
        friend_request = Friend(
            user_id=current_user.id,
            friend_user_id=user_id,
            status='pending'
        )
        
        db.session.add(friend_request)
        db.session.commit()
        
        return jsonify({
            'message': f'{target_user.username}さんに友達申請を送信しました',
            'target_user': target_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@qr_bp.route('/qr/parse', methods=['POST'])
def parse_qr_data():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        data = request.get_json()
        qr_data = data.get('qr_data', '')
        
        # QRコードデータの解析
        if qr_data.startswith('timetable-share://add-friend/'):
            user_id = qr_data.replace('timetable-share://add-friend/', '')
            
            # ユーザー情報を取得
            target_user = User.query.get(user_id)
            if not target_user:
                return jsonify({'error': 'ユーザーが見つかりません'}), 404
            
            return jsonify({
                'type': 'add_friend',
                'user_id': user_id,
                'user_info': target_user.to_dict()
            }), 200
        else:
            return jsonify({'error': '無効なQRコードです'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

