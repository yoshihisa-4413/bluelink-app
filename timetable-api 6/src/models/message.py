from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    # リレーションシップ
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_read': self.is_read,
            'sender': {
                'id': self.sender.id,
                'username': self.sender.username
            } if self.sender else None,
            'receiver': {
                'id': self.receiver.id,
                'username': self.receiver.username
            } if self.receiver else None
        }

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    last_message_id = db.Column(db.Integer, db.ForeignKey('messages.id'), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # リレーションシップ
    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])
    last_message = db.relationship('Message', foreign_keys=[last_message_id])
    
    # ユニーク制約（同じユーザー間の会話は1つまで）
    __table_args__ = (db.UniqueConstraint('user1_id', 'user2_id', name='unique_conversation'),)
    
    def to_dict(self, current_user_id):
        # 相手のユーザー情報を取得
        other_user = self.user2 if self.user1_id == current_user_id else self.user1
        
        return {
            'id': self.id,
            'other_user': {
                'id': other_user.id,
                'username': other_user.username
            },
            'last_message': self.last_message.to_dict() if self.last_message else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

