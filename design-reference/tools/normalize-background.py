"""Save an opaque master and a pixel-preserving 1600x900 game background."""

import argparse
from pathlib import Path

from PIL import Image


parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("master", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()

with Image.open(args.source) as source:
    master = source.convert("RGB")
    args.master.parent.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    master.save(args.master, format="PNG")
    output = master.resize((1600, 900), resample=Image.Resampling.NEAREST)
    output.save(args.output, format="PNG")
    print(f"Master: {args.master} ({master.size[0]}x{master.size[1]}, RGB)")
    print(f"Final: {args.output} ({output.size[0]}x{output.size[1]}, RGB)")
