import json
import os
import urllib.request
import urllib.error

STYLE_LABELS = {
    'expert': 'экспертный — глубина, авторитет, факты',
    'selling': 'продающий — прогрев к покупке, закрытие возражений',
    'teaching': 'обучающий — пошаговая польза, простые формулировки',
    'viral': 'вирусный — максимум охватов, интрига, эмоции',
}

PLATFORM_LABELS = {
    'instagram': 'Instagram (карусель, формат 4:5, эмодзи, цепляющие крючки, хештеги уместны)',
    'telegram': 'Telegram (пост-карусель, чуть более длинные абзацы, форматирование, без хештегов)',
    'vk': 'VK (карусель/клип, дружелюбный тон, призывы вступить и поделиться)',
}


def build_prompt(topic: str, style: str, platform: str, count: int) -> str:
    style_desc = STYLE_LABELS.get(style, STYLE_LABELS['viral'])
    platform_desc = PLATFORM_LABELS.get(platform, PLATFORM_LABELS['instagram'])
    return f'''Ты — топовый SMM-копирайтер и контент-стратег. Создай вирусную карусель.

ТЕМА: {topic}
СТИЛЬ: {style_desc}
ПЛОЩАДКА: {platform_desc}
КОЛИЧЕСТВО СЛАЙДОВ: {count}

Требования:
- Первый слайд — мощный цепляющий заголовок (hook), который заставляет листать.
- Каждый слайд: короткий ёмкий текст (1-3 предложения), идея визуала и готовый промпт для нейросети Nano Banana / Midjourney на английском языке (с указанием единого фирменного стиля, формат под площадку).
- Все слайды в едином визуальном стиле.
- Последний слайд — призыв к действию (CTA).
- Придумай короткое кодовое слово для комментариев (1 слово, заглавными).
- Адаптируй язык и подачу под выбранную площадку.

Верни СТРОГО валидный JSON без markdown и пояснений в формате:
{{
  "hook": "заголовок первого слайда",
  "codeWord": "СЛОВО",
  "cta": "призыв к действию",
  "slides": [
    {{"role": "Обложка", "text": "...", "visualIdea": "...", "prompt": "english prompt for image generation"}}
  ]
}}
Слайдов должно быть ровно {count}.'''


def call_claude(api_key: str, prompt: str) -> dict:
    payload = {
        'model': 'claude-sonnet-4-20250514',
        'max_tokens': 3000,
        'messages': [{'role': 'user', 'content': prompt}],
    }
    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'content-type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    text = data['content'][0]['text'].strip()
    if text.startswith('```'):
        text = text.split('```', 2)[1]
        if text.startswith('json'):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def handler(event: dict, context) -> dict:
    '''Генерирует уникальную вирусную карусель через Claude по теме, стилю и площадке'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'})}

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    topic = (body.get('topic') or '').strip()
    style = body.get('style') or 'viral'
    platform = body.get('platform') or 'instagram'
    try:
        count = int(body.get('count') or 7)
    except (TypeError, ValueError):
        count = 7
    count = max(3, min(10, count))

    if not topic:
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Введите тему'})}

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        return {'statusCode': 500, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'ANTHROPIC_API_KEY не настроен'})}

    prompt = build_prompt(topic, style, platform, count)

    try:
        result = call_claude(api_key, prompt)
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', 'ignore')
        return {'statusCode': 502, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Ошибка AI', 'detail': detail})}
    except Exception as e:
        return {'statusCode': 500, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})}

    slides = []
    for i, s in enumerate(result.get('slides', [])):
        slides.append({
            'index': i,
            'role': s.get('role') or f'Слайд {i + 1}',
            'text': s.get('text') or '',
            'visualIdea': s.get('visualIdea') or '',
            'prompt': s.get('prompt') or '',
        })

    out = {
        'topic': topic,
        'style': style,
        'platform': platform,
        'hook': result.get('hook') or (slides[0]['text'] if slides else ''),
        'cta': result.get('cta') or '',
        'codeWord': (result.get('codeWord') or 'СТАРТ').upper(),
        'slides': slides,
    }

    return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps(out, ensure_ascii=False)}