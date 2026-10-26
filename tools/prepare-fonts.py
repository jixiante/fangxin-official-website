"""Regenerate the website font subset after changing copy.
Requires fonttools[woff] and the original Noto Sans SC variable TTF.
Usage: python tools/prepare-fonts.py PATH_TO_ORIGINAL_FONT_DIRECTORY
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from html.parser import HTMLParser
import sys,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1])
OUT=ROOT/'assets/fonts';OUT.mkdir(exist_ok=True)
class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[]
    def handle_data(self,data):self.parts.append(data)
    def handle_starttag(self,tag,attrs):
        self.parts.extend(v for k,v in attrs if k in ['alt','aria-label'] and v)
text=Text()
for p in (ROOT/'dist').glob('*/*/index.html'):text.feed(p.read_text(encoding='utf8'))
for p in (ROOT/'dist').glob('*/index.html'):text.feed(p.read_text(encoding='utf8'))
for p in (ROOT/'dist').glob('*/*/*/index.html'):text.feed(p.read_text(encoding='utf8'))
required={ord(c) for c in ''.join(text.parts) if not c.isspace()}
# Keep common Latin and Cyrillic ranges in addition to every current page character.
wanted=required|set(range(32,592))|set(range(1024,1328))|{0x20ac,0x2197,0x2193,0x25b7,0x2630}
report={}
for name,family,maxweight in [('notosanssc','sans',600),('notosans','international',600),('notoserifsc','serif',700)]:
    source=next(SOURCE.glob(name+'-*.ttf'))
    font=TTFont(source)
    cmap=font.getBestCmap()
    family_required=required if family in ['sans','serif'] else {c for c in required if c<0x3000}
    missing=family_required-set(cmap)
    # Symbol-only fallbacks are intentional; all text alphabets must be covered.
    missing_text=[c for c in missing if chr(c).isalnum()]
    assert not missing_text,(name,[(hex(c),chr(c)) for c in missing_text])
    options=subset.Options();options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*']
    options.notdef_glyph=True;options.notdef_outline=True
    sub=subset.Subsetter(options=options);sub.populate(unicodes=wanted&set(cmap));sub.subset(font)
    axes={'wght':(400,400,maxweight)}
    if any(axis.axisTag=='wdth' for axis in font['fvar'].axes):axes['wdth']=100
    font=instantiateVariableFont(font,axes,inplace=True)
    font.flavor='woff2';target=OUT/f'hainan-{family}.woff2';font.save(target)
    shutil.copyfile(SOURCE/(name+'-OFL.txt'),OUT/(name+'-OFL.txt'))
    report[family]={'source':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'woff2_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'weight_range':[400,maxweight],'required_characters':len(family_required),'covered_text_characters':len(family_required)-len(missing),'missing_symbols':[hex(c) for c in sorted(missing)],'russian_alphabet_covered':all(ord(c) in cmap for c in 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя')}
    report[family]['codepoints']=sorted(TTFont(target).getBestCmap())
(OUT/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:{a:b for a,b in v.items() if a!='codepoints'} for k,v in report.items()},ensure_ascii=False,indent=2))
