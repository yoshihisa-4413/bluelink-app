from flask import Blueprint, request, jsonify, session
from src.models.user import User, db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'ユーザー名とパスワードが必要です'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            return jsonify({
                'message': 'ログインに成功しました',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'ユーザー名またはパスワードが間違っています'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'すべてのフィールドが必要です'}), 400
        
        # ユーザー名の重複チェック
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'このユーザー名は既に使用されています'}), 400
        
        # メールアドレスの重複チェック
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'このメールアドレスは既に使用されています'}), 400
        
        # 新しいユーザーを作成
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user.id
        
        return jsonify({
            'message': '登録に成功しました',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'ログアウトしました'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '認証が必要です'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'ユーザーが見つかりません'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

