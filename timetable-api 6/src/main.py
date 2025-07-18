import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.timetable import timetable_bp
from src.routes.friends import friends_bp
from src.routes.qr import qr_bp
from src.routes.messages import messages_bp
from src.routes.profiles import profiles_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# CORS設定
CORS(app, supports_credentials=True)

# ブループリントの登録
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(timetable_bp, url_prefix='/api')
app.register_blueprint(friends_bp, url_prefix='/api')
app.register_blueprint(qr_bp, url_prefix='/api')
app.register_blueprint(messages_bp, url_prefix='/api')
app.register_blueprint(profiles_bp, url_prefix='/api')

# データベース設定
import os
if os.environ.get('RENDER'):
    # 本番環境用（メモリ内データベース）
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
else:
    # ローカル環境用
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/timetable.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/debug')
def debug():
    return f"Static folder: {app.static_folder}<br>Exists: {os.path.exists(app.static_folder) if app.static_folder else 'None'}<br>Contents: {os.listdir(app.static_folder) if app.static_folder and os.path.exists(app.static_folder) else 'None'}"

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
