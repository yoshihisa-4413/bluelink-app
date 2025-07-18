from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from src.models.message import Message, Conversation
from src.models.friend import Friend
from datetime import datetime

messages_bp = Blueprint('messages', __name__)

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

@messages_bp.route('/conversations', methods=['GET'])
def get_conversations():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # ユーザーが参加している会話を取得
        conversations = Conversation.query.filter(
            (Conversation.user1_id == user.id) | (Conversation.user2_id == user.id)
        ).order_by(Conversation.updated_at.desc()).all()
        
        return jsonify({
            'conversations': [conv.to_dict(user.id) for conv in conversations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@messages_bp.route('/conversations/<user_id>', methods=['GET'])
def get_or_create_conversation(user_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    if user_id == user.id:
        return jsonify({'error': '自分自身との会話はできません'}), 400
    
    # 友達かどうかを確認
    if not are_friends(user.id, user_id):
        return jsonify({'error': '友達でないユーザーとはメッセージできません'}), 403
    
    try:
        # 既存の会話を検索
        conversation = Conversation.query.filter(
            ((Conversation.user1_id == user.id) & (Conversation.user2_id == user_id)) |
            ((Conversation.user1_id == user_id) & (Conversation.user2_id == user.id))
        ).first()
        
        # 会話が存在しない場合は新規作成
        if not conversation:
            # user1_idを小さい方のIDにする（一意性を保つため）
            user1_id = min(user.id, user_id)
            user2_id = max(user.id, user_id)
            
            conversation = Conversation(
                user1_id=user1_id,
                user2_id=user2_id
            )
            db.session.add(conversation)
            db.session.commit()
        
        return jsonify({'conversation': conversation.to_dict(user.id)}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@messages_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_messages(conversation_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 会話の存在確認とアクセス権限チェック
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({'error': '会話が見つかりません'}), 404
        
        if user.id not in [conversation.user1_id, conversation.user2_id]:
            return jsonify({'error': 'この会話にアクセスする権限がありません'}), 403
        
        # ページネーション用のパラメータ
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # メッセージを取得（新しい順）
        messages_query = Message.query.filter(
            ((Message.sender_id == conversation.user1_id) & (Message.receiver_id == conversation.user2_id)) |
            ((Message.sender_id == conversation.user2_id) & (Message.receiver_id == conversation.user1_id))
        ).order_by(Message.created_at.desc())
        
        messages = messages_query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # 未読メッセージを既読にする
        unread_messages = Message.query.filter(
            Message.receiver_id == user.id,
            Message.sender_id == (conversation.user2_id if user.id == conversation.user1_id else conversation.user1_id),
            Message.is_read == False
        ).all()
        
        for msg in unread_messages:
            msg.is_read = True
        
        db.session.commit()
        
        return jsonify({
            'messages': [msg.to_dict() for msg in reversed(messages.items)],  # 古い順に並び替え
            'pagination': {
                'page': messages.page,
                'pages': messages.pages,
                'per_page': messages.per_page,
                'total': messages.total,
                'has_next': messages.has_next,
                'has_prev': messages.has_prev
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@messages_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
def send_message(conversation_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'error': 'メッセージ内容が必要です'}), 400
        
        # 会話の存在確認とアクセス権限チェック
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({'error': '会話が見つかりません'}), 404
        
        if user.id not in [conversation.user1_id, conversation.user2_id]:
            return jsonify({'error': 'この会話にアクセスする権限がありません'}), 403
        
        # 受信者のIDを決定
        receiver_id = conversation.user2_id if user.id == conversation.user1_id else conversation.user1_id
        
        # メッセージを作成
        message = Message(
            sender_id=user.id,
            receiver_id=receiver_id,
            content=content
        )
        
        db.session.add(message)
        db.session.flush()  # IDを取得するため
        
        # 会話の最新メッセージと更新時刻を更新
        conversation.last_message_id = message.id
        conversation.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': message.to_dict(),
            'conversation': conversation.to_dict(user.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@messages_bp.route('/unread-count', methods=['GET'])
def get_unread_count():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        # 未読メッセージ数を取得
        unread_count = Message.query.filter(
            Message.receiver_id == user.id,
            Message.is_read == False
        ).count()
        
        return jsonify({'unread_count': unread_count}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

