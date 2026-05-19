from flask import Flask, request, jsonify
import pyodbc
import requests
from youtube_transcript_api import YouTubeTranscriptApi

app = Flask(__name__)


def get_connection():
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;"
        "DATABASE=vietnamese;"
        "Trusted_Connection=yes;"
    )


def get_youtube_title(video_id):
    url = (
        f"https://www.youtube.com/oembed?"
        f"url=https://www.youtube.com/watch?v={video_id}&format=json"
    )

    try:
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            return response.json().get("title", video_id)

    except Exception as e:
        print("Title error:", e)

    return video_id


def get_transcript(video_id):

    try:
        transcript = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=['vi']
        )

        return transcript

    except Exception as e:
        print("Transcript error:", e)
        return []


def insert_video(video_id, created_by):

    conn = get_connection()
    cursor = conn.cursor()

    try:

        title = get_youtube_title(video_id)

        cursor.execute("""
            IF NOT EXISTS (
                SELECT 1
                FROM Videos
                WHERE YoutubeId = ?
            )
            BEGIN
                INSERT INTO Videos (
                    YoutubeId,
                    Title,
                    CreatedBy,
                    Status
                )
                VALUES (?, ?, ?, 1)
            END
        """, (
            video_id,
            video_id,
            title,
            created_by
        ))

        conn.commit()

        cursor.execute("""
            SELECT VideoId
            FROM Videos
            WHERE YoutubeId = ?
        """, (video_id,))

        row = cursor.fetchone()

        if not row:
            return None

        db_video_id = row[0]

        cursor.execute("""
            DELETE FROM Transcripts
            WHERE VideoId = ?
        """, (db_video_id,))

        conn.commit()

        transcript = get_transcript(video_id)

        data = []

        for line in transcript:

            text = line.get("text", "").strip()

            if text == "":
                continue

            data.append((
                db_video_id,
                text,
                float(line.get("start", 0))
            ))

        if len(data) > 0:

            cursor.fast_executemany = True

            cursor.executemany("""
                INSERT INTO Transcripts (
                    VideoId,
                    Sentence,
                    StartTime
                )
                VALUES (?, ?, ?)
            """, data)

            conn.commit()

        return title

    except Exception as e:

        conn.rollback()
        raise e

    finally:

        cursor.close()
        conn.close()


@app.route('/crawl', methods=['POST'])
def crawl():

    try:

        data = request.get_json()

        print("Request:", data)

        if not data:
            return jsonify({
                "error": "No JSON received"
            }), 400

        video_id = data.get('youtubeId')
        created_by = data.get('createdBy')

        if not video_id:
            return jsonify({
                "error": "youtubeId is required"
            }), 400

        if created_by is None:
            return jsonify({
                "error": "createdBy is required"
            }), 400

        title = insert_video(video_id, created_by)

        return jsonify({
            "status": "success",
            "title": title
        })

    except Exception as e:

        print("ERROR:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )