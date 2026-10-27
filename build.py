# src/ の部品を1つの index.html にまとめる: python3 build.py
import os
d=os.path.dirname(os.path.abspath(__file__));S=lambda f:open(os.path.join(d,'src',f),encoding='utf-8').read()
t=S('ui.html').replace('/*__XLSX__*/',S('xlsx.js')).replace('/*__APP__*/',S('app.js'))
open(os.path.join(d,'index.html'),'w',encoding='utf-8').write('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+t+'</body></html>')
print('index.html built')
