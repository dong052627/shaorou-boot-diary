#!/usr/bin/env python3
"""更新 sw.js 的快取清單與版本號。改完任何檔案後執行一次:  python3 tools/build_sw.py"""
import os, re, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'.git', 'tools'}
SKIP_FILES = {'sw.js', 'README.md'}
files = ['./']
for d, dirs, fs in os.walk(ROOT):
    dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS)
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/')
        if f in SKIP_FILES or f.startswith('.'):
            continue
        files.append('./' + rel)
p = os.path.join(ROOT, 'sw.js'); s = open(p, encoding='utf-8').read()
s = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{time.strftime('%Y%m%d-%H%M%S')}';", s)
s = re.sub(r"const CORE = \[[\s\S]*?\];", 'const CORE = [\n' + ''.join(f"  '{f}',\n" for f in files) + '];', s)
open(p, 'w', encoding='utf-8').write(s)
print(f'sw.js 已更新:{len(files)} 個檔案')
