from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from src.models.profile import Profile
from src.models.friend import Friend

profiles_bp = Blueprint('profiles', __name__)

def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def are_friends(user1_id, user2_id):
    """2人のユーザーが友達かどうかを確認"""
    friendship = Friend.query.filter(
        ((Friend.user_id == user1_id) & (Friend.friend_user_id == user2_id)) |
        ((Friend.user_id == user2_id) & (Friend.friend_user_id == user1_id))
    ).filter(Friend.status == 'accepted').first()
    
    return friendship is not None

@profiles_bp.route('/profile', methods=['GET'])
def get_my_profile():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        profile = Profile.query.filter_by(user_id=user.id).first()
        
        if not profile:
            # プロフィールが存在しない場合は空のプロフィールを作成
            profile = Profile(user_id=user.id)
            db.session.add(profile)
            db.session.commit()
        
        return jsonify({'profile': profile.to_dict(is_owner=True)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profiles_bp.route('/profile', methods=['PUT'])
def update_my_profile():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        data = request.get_json()
        
        profile = Profile.query.filter_by(user_id=user.id).first()
        
        if not profile:
            profile = Profile(user_id=user.id)
            db.session.add(profile)
        
        # プロフィール情報を更新
        if 'bio' in data:
            profile.bio = data['bio']
        if 'grade' in data:
            profile.grade = data['grade']
        if 'department' in data:
            profile.department = data['department']
        if 'hobbies' in data:
            profile.hobbies = data['hobbies']
        if 'avatar_url' in data:
            profile.avatar_url = data['avatar_url']
        if 'is_public' in data:
            profile.is_public = bool(data['is_public'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'プロフィールを更新しました',
            'profile': profile.to_dict(is_owner=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profiles_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 対象ユーザーの存在確認
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        
        # 自分のプロフィールの場合
        if user_id == user.id:
            profile = Profile.query.filter_by(user_id=user_id).first()
            if not profile:
                profile = Profile(user_id=user_id)
                db.session.add(profile)
                db.session.commit()
            return jsonify({'profile': profile.to_dict(is_owner=True)}), 200
        
        # 友達かどうかを確認
        is_friend = are_friends(user.id, user_id)
        
        profile = Profile.query.filter_by(user_id=user_id).first()
        
        if not profile:
            return jsonify({
                'profile': {
                    'user_id': user_id,
                    'username': target_user.username,
                    'message': 'プロフィールが設定されていません'
                }
            }), 200
        
        # 友達でない場合、公開プロフィールのみ表示
        if not is_friend and not profile.is_public:
            return jsonify({
                'profile': {
                    'user_id': user_id,
                    'username': target_user.username,
                    'is_public': False,
                    'message': 'このプロフィールは非公開です'
                }
            }), 200
        
        return jsonify({'profile': profile.to_dict(is_owner=False)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profiles_bp.route('/profile/avatar', methods=['POST'])
def upload_avatar():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 簡単なアバター生成（実際の実装では画像アップロード機能を追加）
        data = request.get_json()
        avatar_type = data.get('avatar_type', 'default')
        
        # プロフィールを取得または作成
        profile = Profile.query.filter_by(user_id=user.id).first()
        if not profile:
            profile = Profile(user_id=user.id)
            db.session.add(profile)
        
        # 簡単なアバターURL生成（実際の実装では画像ファイルを処理）
        avatar_url = f"https://ui-avatars.com/api/?name={user.username}&background=random&size=200"
        profile.avatar_url = avatar_url
        
        db.session.commit()
        
        return jsonify({
            'message': 'アバターを更新しました',
            'avatar_url': avatar_url
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

