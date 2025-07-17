from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    bio = db.Column(db.Text, nullable=True)  # 自己紹介文
    grade = db.Column(db.String(50), nullable=True)  # 学年
    department = db.Column(db.String(100), nullable=True)  # 学部
    hobbies = db.Column(db.Text, nullable=True)  # 趣味・興味
    avatar_url = db.Column(db.String(255), nullable=True)  # プロフィール画像URL
    is_public = db.Column(db.Boolean, default=True)  # 公開/非公開設定
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーションシップ
    user = db.relationship('User', backref=db.backref('profile', uselist=False))
    
    def to_dict(self, is_owner=False):
        # プロフィールが非公開で、所有者でない場合は限定的な情報のみ返す
        if not self.is_public and not is_owner:
            return {
                'id': self.id,
                'user_id': self.user_id,
                'username': self.user.username,
                'is_public': self.is_public,
                'message': 'このプロフィールは非公開です'
            }
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username,
            'bio': self.bio,
            'grade': self.grade,
            'department': self.department,
            'hobbies': self.hobbies,
            'avatar_url': self.avatar_url,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

