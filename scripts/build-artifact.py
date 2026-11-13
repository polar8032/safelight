#!/usr/bin/env python3
"""Write build/artifact.html: the page body between the artifact markers, for publishing as a Claude artifact
(the artifact host supplies its own <html>/<head> skeleton)."""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text(encoding='utf-8')
body = src.split('<!-- artifact:start -->', 1)[1].split('<!-- artifact:end -->', 1)[0].strip() + '\n'
out = root / 'build' / 'artifact.html'
out.parent.mkdir(exist_ok=True)
out.write_text(body, encoding='utf-8')
print(out, len(body))
