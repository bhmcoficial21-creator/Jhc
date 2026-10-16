import json,re,unicodedata
d=json.load(open('all.json'))
script={'ja-JP':r'[぀-ヿ一-鿿]','zh-CN':r'[一-鿿]','ru-RU':r'[Ѐ-ӿ]','ar-EG':r'[؀-ۿ]'}
issues=[];tot=0
for v,b in d.items():
    sits=b['list']+([b['bonus']] if b['bonus'] else [])
    for s in sits:
        ls=s.get('lines') or []
        if not ls: issues.append((v,s['id'],'sem linhas'));continue
        seen=set()
        for i,l in enumerate(ls):
            tot+=1
            t=l.get('txt','');pt=l.get('pt','');pr=l.get('pron')
            if not t.strip(): issues.append((v,s['id'],i,'txt vazio'))
            if not pt.strip(): issues.append((v,s['id'],i,'pt vazio'))
            if l.get('sp') not in ('you','them'): issues.append((v,s['id'],i,'sp',l.get('sp')))
            if t in seen: issues.append((v,s['id'],i,'duplicada',t))
            seen.add(t)
            if v in script and not re.search(script[v],t): issues.append((v,s['id'],i,'script errado',t))
            if v in script and not pr: issues.append((v,s['id'],i,'sem pron',t))
            if v not in script and re.search(r'[぀-ヿ一-鿿Ѐ-ӿ؀-ۿ]',t): issues.append((v,s['id'],i,'script estranho',t))
            if re.search(r'\s{2,}|^\s|\s$',t): issues.append((v,s['id'],i,'espaços',repr(t)))
            if re.search(r'[�]|\?\?',t+pt): issues.append((v,s['id'],i,'char quebrado'))
            if '  ' in pt or re.search(r'\b(the|you|please)\b',pt,re.I) and v.startswith('en'): pass
print('linhas',tot,'problemas',len(issues))
for x in issues[:60]: print(x)
print(sorted({k for b in d.values() for s in b['list'] for l in s['lines'] for k in l}))
print([ (s['id'],len(s['lines'])) for s in d['en-US']['list']], d['en-US']['bonus']['id'],len(d['en-US']['bonus']['lines']))
