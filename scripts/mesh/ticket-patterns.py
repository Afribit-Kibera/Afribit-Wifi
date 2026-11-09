"""Print the security-print patterns used on Mesh pass tickets as CSS variables.

The ticket materials (guilloche waves, mesh lattice, rosette, fine lines) are
drawn here from simple maths instead of shipped as images, so they stay sharp
and add only a few KB. Paste the output into app/mesh-flow.css under
"Ticket patterns" when changing them:

    python scripts/mesh/ticket-patterns.py
"""
import math


def uri(svg):
    return 'url("data:image/svg+xml,' + svg.replace('"', "'").replace("<", "%3C").replace(">", "%3E").replace("#", "%23") + '")'


def path(points):
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in points)


def waves(color, opacity, lines=9, amp=(20, 9), width=200, height=100):
    """Overlapping sine waves; each period divides the tile, so it repeats seamlessly."""
    paths = []
    for i in range(lines):
        phase = i * 2 * math.pi / lines
        pts = [(x, height / 2 + amp[0] * math.sin(2 * math.pi * x / width + phase) + amp[1] * math.sin(6 * math.pi * x / width + 2 * phase))
               for x in range(0, width + 1, 5)]
        paths.append(path(pts))
    return uri(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"><path d="{" ".join(paths)}" fill="none" stroke="{color}" stroke-opacity="{opacity}" stroke-width=".7"/></svg>')


def lattice(color, opacity, size=26):
    """A mesh network: nodes joined to their neighbours."""
    h = size / 2
    return uri(f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}"><g fill="{color}" fill-opacity="{opacity}" stroke="{color}" stroke-opacity="{opacity * .55}" stroke-width=".7">'
               f'<path d="M0 0L{size} {size}M{size} 0L0 {size}" fill="none"/><circle cx="0" cy="0" r="1.6"/><circle cx="{size}" cy="0" r="1.6"/><circle cx="0" cy="{size}" r="1.6"/><circle cx="{size}" cy="{size}" r="1.6"/><circle cx="{h}" cy="{h}" r="2.1"/></g></svg>')


def rosette(color, opacity, size=120):
    """A banknote-style hypotrochoid rosette."""
    big, small, pen = 7.0, 3.0, 5.2
    scale = size / 2 / (big - small + pen) * .96
    pts = []
    for step in range(0, 721):
        t = step / 720 * 2 * math.pi * small
        x = (big - small) * math.cos(t) + pen * math.cos((big - small) / small * t)
        y = (big - small) * math.sin(t) - pen * math.sin((big - small) / small * t)
        pts.append((size / 2 + x * scale, size / 2 + y * scale))
    return uri(f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}"><path d="{path(pts)}" fill="none" stroke="{color}" stroke-opacity="{opacity}" stroke-width=".6"/></svg>')


if __name__ == "__main__":
    print("  --ticket-waves: " + waves("#ffffff", .42) + ";")
    print("  --ticket-lattice: " + lattice("#203c32", .2) + ";")
    print("  --ticket-rosette: " + rosette("#d8b45a", .75) + ";")
    print("  --ticket-lines: " + waves("#ffffff", .09, lines=14, amp=(6, 3), height=40) + ";")
