import os
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import PIL.Image
from ultralytics import YOLO
from ensemble_boxes import weighted_boxes_fusion
import google.genai as genai

print("Initializing models...")


def resolve_local_model(model_filename: str) -> Path:
    """Resolve the offline model path across common project layouts and apostrophe variants."""
    script_dir = Path(__file__).resolve().parent
    cwd = Path.cwd().resolve()
    project_candidates = [script_dir, script_dir.parent, cwd, cwd.parent]

    candidates = []
    for base in dict.fromkeys(project_candidates):
        for relative in [
            Path("ai") / model_filename,
            Path("T-10 Cherubim") / "ai" / model_filename,
            Path("T-10 Cherubim") / model_filename,
            Path(model_filename),
        ]:
            candidates.append((base / relative).resolve())

    candidate_variants = []
    for candidate in candidates:
        candidate_variants.append(candidate)
        if "Argonyx26_Hackathon" in str(candidate):
            candidate_variants.append(Path(str(candidate).replace("Argonyx26_Hackathon", "Argonyx'26_Hackathon")))
        if "Argonyx'26_Hackathon" in str(candidate):
            candidate_variants.append(Path(str(candidate).replace("Argonyx'26_Hackathon", "Argonyx26_Hackathon")))

    for candidate in dict.fromkeys(candidate_variants):
        if candidate.exists():
            return candidate

    searched = "\n".join(str(p) for p in dict.fromkeys(candidate_variants))
    raise FileNotFoundError(f"Offline model not found: {model_filename}\nSearched:\n{searched}")


mira_path = resolve_local_model("mira_exp019.pt")
alope_path = resolve_local_model("alope_best.pt")
model_mira = YOLO(str(mira_path))
model_alope = YOLO(str(alope_path))

ALOPE_TO_MASTER = {0: 0, 1: 2, 2: 3, 3: 4}
MASTER_CLASSES = {0: 'glass', 1: 'metal', 2: 'paper', 3: 'plastic', 4: 'trash'}

SUPERCLASS_MAP = {
    "glass": "Recyclable",
    "metal": "Recyclable",
    "paper": "Recyclable",
    "plastic": "Hazardous/Non-Biodegradable",
    "trash": "General Waste"
}

# 2. Initialize Gemini if an API key is available
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
vlm_client = None
if GOOGLE_API_KEY:
    try:
        vlm_client = genai.Client(api_key=GOOGLE_API_KEY)
    except Exception:
        vlm_client = None


def scope_environment(image_path):
    """Use Gemini as an environmental verifier when the API is available."""
    if vlm_client is None:
        return {"is_designated_waste_zone": False, "environmental_sensitivity": 4, "macro_description": "Fallback"}

    try:
        img = PIL.Image.open(image_path)
        prompt = """
        Analyze this image and determine the macro-environment for urban situational awareness.
        Output ONLY a raw JSON object with this exact schema:
        {
            "is_designated_waste_zone": boolean,
            "environmental_sensitivity": int (0 to 10 scale of accumulation severity),
            "macro_description": "string"
        }
        """
        response = vlm_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[prompt, img],
        )
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text.removeprefix("```json").strip()
        if raw_text.endswith("```"):
            raw_text = raw_text.removesuffix("```").strip()
        return json.loads(raw_text)
    except Exception:
        return {"is_designated_waste_zone": False, "environmental_sensitivity": 4, "macro_description": "Fallback"}


def analyze_waste_image(image_path, output_path="annotated_output.jpg", imgsz=960):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image at {image_path}")

    img_h, img_w = img.shape[:2]
    total_area = img_h * img_w

    env_context = scope_environment(image_path)

    res_mira = model_mira.predict(source=image_path, conf=0.045, iou=0.45, imgsz=imgsz, save=False)[0]
    res_alope = model_alope.predict(source=image_path, conf=0.15, iou=0.45, imgsz=imgsz, save=False)[0]

    boxes_list = [[], []]
    scores_list = [[], []]
    labels_list = [[], []]

    for box in res_mira.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        if ((x2 - x1) * (y2 - y1)) / total_area > 0.35:
            continue
        boxes_list[0].append([x1 / img_w, y1 / img_h, x2 / img_w, y2 / img_h])
        scores_list[0].append(float(box.conf[0]))
        labels_list[0].append(int(box.cls[0]))

    for box in res_alope.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        if ((x2 - x1) * (y2 - y1)) / total_area > 0.35:
            continue
        boxes_list[1].append([x1 / img_w, y1 / img_h, x2 / img_w, y2 / img_h])
        scores_list[1].append(float(box.conf[0]))
        labels_list[1].append(ALOPE_TO_MASTER[int(box.cls[0])])

    boxes, scores, labels = weighted_boxes_fusion(
        boxes_list, scores_list, labels_list, weights=[1, 2.5], iou_thr=0.55, skip_box_thr=0.05
    )

    detections = []
    for box, score, label in zip(boxes, scores, labels):
        x1, y1, x2, y2 = int(box[0] * img_w), int(box[1] * img_h), int(box[2] * img_w), int(box[3] * img_h)
        class_name = MASTER_CLASSES[int(label)]
        superclass = SUPERCLASS_MAP.get(class_name, "Unknown")

        detections.append({
            "label": class_name,
            "superclass": superclass,
            "confidence": round(float(score), 2),
            "bbox": [x1, y1, x2, y2]
        })
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, f"{class_name} {score:.2f}", (x1, max(y1 - 10, 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    yolo_count = len(detections)
    yolo_score = min(1.0, yolo_count * 0.15)

    if env_context.get("is_designated_waste_zone", False):
        is_threat = False
        threat_score = 0.0
    elif env_context.get("environmental_sensitivity", 0) >= 6:
        is_threat = True
        threat_score = max(yolo_score, 0.85)
    else:
        is_threat = yolo_count >= 3
        threat_score = yolo_score

    payload = {
        "threat_detected": is_threat,
        "threat_score": round(threat_score, 2),
        "total_objects": yolo_count,
        "environmental_context": env_context,
        "detections": detections,
        "location": {"latitude": 12.9716, "longitude": 77.5946}
    }

    cv2.imwrite(output_path, img)
    return payload


if __name__ == "__main__":
    test_img = sys.argv[1] if len(sys.argv) > 1 else "C:\\Users\\Arya Shetty\\Desktop\\Argonyx'26_Hackathon\\T-10 Cherubim\\assets\\trash-photos\\Trash-image-1.jpeg"

    if os.path.exists(test_img):
        print(f"Analyzing {test_img}...")
        result = analyze_waste_image(test_img)
        print("\n========== JSON PAYLOAD ==========")
        print(json.dumps(result, indent=2))
        print("\n✅ Saved annotated_output.jpg to your folder.")
    else:
        print(f"\n❌ ERROR: Could not find image at path: '{test_img}'")
        print("Double-check your spelling and folder structure!")