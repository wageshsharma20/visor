"""
Generate public/demo/scene.tracks.json from a demo video using a real detector + tracker,
so the VISOR demo scene shows boxes that actually line up with people and cars.

Usage:
    pip install ultralytics opencv-python
    python tools/make_demo_tracks.py path/to/scene.mp4 public/demo/scene.tracks.json --stride 2

Then copy the video to public/demo/scene.mp4.
Good free sources for footage: Pexels / Pixabay ("office lobby", "street crossing", "airport").

Output format (consumed by src/sources/recordedTracks.ts):
{
  "source": { "width": 1920, "height": 1080, "fps": 30.0 },
  "frames": [
    { "frameId": 0, "t": 0.0,                       # seconds into the video
      "detections": [
        { "trackId": "T004", "classId": "person", "confidence": 0.9841,
          "bbox": { "x": 0.21, "y": 0.17, "w": 0.08, "h": 0.37 } }   # normalized 0..1
      ] }
  ]
}
"""
import argparse
import json

import cv2
from ultralytics import YOLO

KEEP = {"person", "car", "truck", "bicycle", "motorcycle", "bus",
        "backpack", "handbag", "suitcase", "dog"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--model", default="yolov8n.pt")
    ap.add_argument("--stride", type=int, default=2, help="keep every Nth frame")
    ap.add_argument("--conf", type=float, default=0.35)
    args = ap.parse_args()

    cap = cv2.VideoCapture(args.video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.release()

    model = YOLO(args.model)
    frames, width, height = [], 0, 0

    results = model.track(args.video, stream=True, persist=True, conf=args.conf,
                          tracker="bytetrack.yaml", verbose=False)
    for i, r in enumerate(results):
        height, width = r.orig_shape
        if i % args.stride:
            continue
        dets = []
        b = r.boxes
        if b is not None and b.id is not None:
            for (x1, y1, x2, y2), tid, conf, cls in zip(
                b.xyxyn.tolist(), b.id.int().tolist(), b.conf.tolist(), b.cls.int().tolist()
            ):
                name = model.names[cls]
                if name not in KEEP:
                    continue
                dets.append({
                    "trackId": f"T{tid:03d}",
                    "classId": name,
                    "confidence": round(float(conf), 4),
                    "bbox": {"x": round(x1, 5), "y": round(y1, 5),
                             "w": round(x2 - x1, 5), "h": round(y2 - y1, 5)},
                })
        frames.append({"frameId": i, "t": round(i / fps, 4), "detections": dets})

    with open(args.out, "w") as f:
        json.dump({"source": {"width": width, "height": height, "fps": fps},
                   "frames": frames}, f, separators=(",", ":"))
    print(f"wrote {len(frames)} frames, {width}x{height} @ {fps:.1f}fps -> {args.out}")


if __name__ == "__main__":
    main()
