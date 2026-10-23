"""Build the hosted page and an offline, self-contained HTML copy. No dependencies."""
from pathlib import Path
import base64
import json
import re

ROOT=Path(__file__).resolve().parent
def build():
    src=ROOT/'src'
    data=json.loads((src/'strings.json').read_text(encoding='utf-8'))
    additions=json.loads((src/'update-strings.json').read_text(encoding='utf-8'))
    for lang in ('fa','en'):data['strings'][lang].update(additions[lang])
    data['storyScenes']=json.loads((src/'story-scenes.json').read_text(encoding='utf-8'))
    html=(src/'template.html').read_text(encoding='utf-8')
    replacements={
      '/*__CSS__*/':(src/'style.css').read_text(encoding='utf-8')+'\n'+(src/'update.css').read_text(encoding='utf-8'),
      '/*__DATA__*/':json.dumps(data,ensure_ascii=False).replace('<','\\u003c'),
      '/*__ENGINE__*/':'var MISSION_DATA='+ (src/'missions.json').read_text(encoding='utf-8').replace('<','\\u003c')+';\n'+(src/'engine.js').read_text(encoding='utf-8'),
      '/*__APP__*/':(src/'app.js').read_text(encoding='utf-8')
    }
    for marker,value in replacements.items():
      assert marker in html,marker
      html=html.replace(marker,value)
    def embed(match):
      path=match.group(0)
      mime='font/ttf' if path.endswith('.ttf') else 'image/png'
      return 'data:'+mime+';base64,'+base64.b64encode((ROOT/path).read_bytes()).decode('ascii')
    offline=re.sub(r'assets/(?:[\w.-]+/)*[\w.-]+\.(?:png|ttf)',embed,html)
    # Resolve every asset before replacing either output, so missing files fail early.
    (ROOT/'index.html').write_text(html,encoding='utf-8')
    (ROOT/'offline.html').write_text(offline,encoding='utf-8')
    print(f'Built index.html ({len(html.encode()):,} bytes) and offline.html ({len(offline.encode()):,} bytes)')
    return html
if __name__=='__main__':build()
