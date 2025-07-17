from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from src.models.timetable import Timetable
from datetime import time

timetable_bp = Blueprint('timetable', __name__)

# 時間割の時間定義
TIME_SLOTS = {
    1: {'start': time(8, 45), 'end': time(10, 15)},
    2: {'start': time(10, 30), 'end': time(12, 0)},
    3: {'start': time(13, 0), 'end': time(14, 30)},
    4: {'start': time(14, 45), 'end': time(16, 15)},
    5: {'start': time(16, 30), 'end': time(18, 0)},
}

# 曜日の変換マップ
DAY_MAP = {
    'monday': 0,
    'tuesday': 1,
    'wednesday': 2,
    'thursday': 3,
    'friday': 4
}

DAY_REVERSE_MAP = {
    0: 'monday',
    1: 'tuesday',
    2: 'wednesday',
    3: 'thursday',
    4: 'friday'
}

def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

@timetable_bp.route('/timetable', methods=['GET'])
def get_timetable():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    timetables = Timetable.query.filter_by(user_id=user.id).all()
    
    # 曜日を文字列に変換してレスポンス
    timetable_data = []
    for t in timetables:
        data = t.to_dict()
        data['day_of_week'] = DAY_REVERSE_MAP.get(t.day_of_week, t.day_of_week)
        timetable_data.append(data)
    
    return jsonify({'timetables': timetable_data}), 200

@timetable_bp.route('/timetable', methods=['POST'])
def create_timetable():
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        data = request.get_json()
        day_of_week_str = data.get('day_of_week')
        period = data.get('period')
        subject_name = data.get('subject_name', '').strip()
        room = data.get('room', '').strip()
        
        if day_of_week_str is None or period is None:
            return jsonify({'error': '曜日と時限が必要です'}), 400
        
        # 曜日を整数に変換
        day_of_week = DAY_MAP.get(day_of_week_str.lower())
        if day_of_week is None:
            return jsonify({'error': '無効な曜日です'}), 400
        
        if period not in TIME_SLOTS:
            return jsonify({'error': '無効な時限です'}), 400
        
        # 既存の時間割をチェック
        existing = Timetable.query.filter_by(
            user_id=user.id,
            day_of_week=day_of_week,
            period=period
        ).first()
        
        if existing:
            # 更新（空の場合は削除）
            if not subject_name and not room:
                db.session.delete(existing)
                db.session.commit()
                return jsonify({'message': '時間割を削除しました'}), 200
            else:
                existing.subject_name = subject_name
                existing.room = room
                db.session.commit()
                
                # レスポンス用に曜日を文字列に変換
                response_data = existing.to_dict()
                response_data['day_of_week'] = day_of_week_str
                return jsonify({'timetable': response_data}), 200
        else:
            # 空の場合は作成しない
            if not subject_name and not room:
                return jsonify({'message': '空の時間割は作成されません'}), 200
            
            # 新規作成
            timetable = Timetable(
                user_id=user.id,
                day_of_week=day_of_week,
                period=period,
                subject_name=subject_name,
                room=room,
                start_time=TIME_SLOTS[period]['start'],
                end_time=TIME_SLOTS[period]['end']
            )
            
            db.session.add(timetable)
            db.session.commit()
            
            # レスポンス用に曜日を文字列に変換
            response_data = timetable.to_dict()
            response_data['day_of_week'] = day_of_week_str
            return jsonify({'timetable': response_data}), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@timetable_bp.route('/timetable/<timetable_id>', methods=['DELETE'])
def delete_timetable(timetable_id):
    user = require_auth()
    if not user:
        return jsonify({'error': '認証が必要です'}), 401
    
    try:
        timetable = Timetable.query.filter_by(id=timetable_id, user_id=user.id).first()
        
        if not timetable:
            return jsonify({'error': '時間割が見つかりません'}), 404
        
        db.session.delete(timetable)
        db.session.commit()
        
        return jsonify({'message': '時間割を削除しました'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@timetable_bp.route('/timetable/user/<user_id>', methods=['GET'])
def get_user_timetable(user_id):
    current_user = require_auth()
    if not current_user:
        return jsonify({'error': '認証が必要です'}), 401
    
    # 友達関係をチェック（簡略化のため、ここでは省略）
    timetables = Timetable.query.filter_by(user_id=user_id).all()
    return jsonify({'timetables': [t.to_dict() for t in timetables]}), 200

