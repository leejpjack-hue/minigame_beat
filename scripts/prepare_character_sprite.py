"""Mechanical chroma-key/size normalization for generated pixel-art masters."""

from argparse import ArgumentParser
from pathlib import Path
from PIL import Image


def prepare(source: Path, destination: Path, key: str) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = []
    for red, green, blue, alpha in image.getdata():
        if key == "green":
            spill = green - max(red, blue)
            if spill > 24:
                alpha = 0
            elif spill > 6:
                green = max(red, blue)
        else:
            spill = min(red, blue) - green
            if spill > 24 and max(red, blue) > 80:
                alpha = 0
            elif spill > 6:
                red = min(red, green)
                blue = min(blue, green)
        pixels.append((red, green, blue, alpha))
    image.putdata(pixels)
    bounds = image.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("Chroma key removed the entire character")
    image = image.crop(bounds)
    ratio = min(88 / image.width, 104 / image.height)
    size = (max(1, round(image.width * ratio)), max(1, round(image.height * ratio)))
    image = image.resize(size, Image.Resampling.NEAREST)
    output = Image.new("RGBA", (96, 112), (0, 0, 0, 0))
    output.alpha_composite(image, ((96 - image.width) // 2, 108 - image.height))
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)
    print(f"{destination}: 96x112 RGBA, artwork={image.width}x{image.height}")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--key", choices=("green", "magenta"), default="green")
    arguments = parser.parse_args()
    prepare(arguments.source, arguments.destination, arguments.key)
