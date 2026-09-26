import os
import sys
import json
from pathlib import Path
import time 
import cv2
import numpy as np
import PIL.Image
from ultralytics import YOLO
from ensemble_boxes import weighted_boxes_fusion

# 1. Import the new unified SDK
from google import genai

# --- Initialize Gemini alongside YOLO using the new SDK ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
client = genai.Client(api_key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None


def resolve_local_model(model_filename: str) -> Path:
    """Resolve an offline model path from several safe candidates, including apostrophe-escaped path variants."""
    script_dir = Path(__file__).resolve().parent
    cwd = Path.cwd().resolve()
    project_candidates = [
        script_dir,
        script_dir.parent,
        script_dir.parent.parent,
        script_dir.parent.parent.parent,
        cwd,
        cwd.parent,
    ]

    candidates = []
    for base in dict.fromkeys(project_candidates):
        for relative in [
            Path(model_filename),
            Path("ai") / model_filename,
            Path("AI") / "Pipeline" / "ai" / model_filename,
            Path("Pipeline") / "ai" / model_filename,
            Path("T10-Cherubim") / "AI" / "Pipeline" / "ai" / model_filename,
            Path("T-10 Cherubim") / "AI" / "Pipeline" / "ai" / model_filename,
            Path("T10-Cherubim") / "ai" / model_filename,
            Path("T-10 Cherubim") / "ai" / model_filename,
            Path("T10-Cherubim") / model_filename,
            Path("T-10 Cherubim") / model_filename,
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


# 2. Load models from the local folder only
print("Initializing models from local disk...")
mira_model_path = resolve_local_model("mira_exp019.pt")
alope_model_path = resolve_local_model("alope_best.pt")
model_mira = YOLO(str(mira_model_path))
model_alope = YOLO(str(alope_model_path))

ALOPE_TO_MASTER = {0: 0, 1: 2, 2: 3, 3: 4}
MASTER_CLASSES = {0: 'glass', 1: 'metal', 2: 'paper', 3: 'plastic', 4: 'trash'}

SUPERCLASS_MAP = {
    "glass": "Recyclable",
    "metal": "Recyclable",
    "paper": "Recyclable",
    "plastic": "Hazardous/Non-Biodegradable",
    "trash": "General Waste"
}


def scope_environment(image_path):
    """Gemini acts purely as an Environmental Verifier"""
    if client is None:
        return {
            "is_designated_waste_zone": False, 
            "environmental_sensitivity": 5, 
            "macro_description": "Gemini API key not configured. YOLO standalone active."
        }

    img = PIL.Image.open(image_path)
    prompt = """
    Analyze this image and determine the macro-environment for urban situational awareness.
    Output ONLY a raw JSON object with this exact schema:
    {
        "is_designated_waste_zone": boolean,
        "environmental_sensitivity": int,
        "macro_description": "string"
    }
    """
    
    # Prioritize the 8B model: it is ultra-fast and usually avoids the main server traffic jams
    models_to_try = [
        'gemini-3.5-flash-lite',  # Try the fastest, lowest-traffic model first
        'gemini-3.1-flash-lite', 
        'gemini-2.5-flash-lite',
        'gemini-3.8-flash',       # Flagship heavy lifter
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-2.5-flash'
    ]
    
    for model_name in models_to_try:
        try:
            print(f"Connecting to {model_name}...")
            response = client.models.generate_content(
                model=model_name, 
                contents=[prompt, img]
            )
            raw_text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            print(f"\n[INFO] Gemini connected successfully using: {model_name}")
            return json.loads(raw_text)
            
        except Exception as e:
            error_msg = str(e).lower()
            if "demand" in error_msg or "429" in error_msg or "quota" in error_msg:
                print(f"[WARN] {model_name} is congested. Waiting 2 seconds before trying the next server...")
                time.sleep(2)
            else:
                print(f"[DEBUG] Failed on {model_name}: {e}")
            continue
            
    print("\n[DEBUG] All Gemini servers are currently congested. Reverting to standalone YOLO mode.\n")
    return {
        "is_designated_waste_zone": False, 
        "environmental_sensitivity": 5, 
        "macro_description": "API limits reached. YOLO standalone active."
    }

def analyze_waste_image(image_path, output_path=None, imgsz=960):
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not load image at {image_path}")
        
    img_h, img_w = img.shape[:2]
    total_area = img_h * img_w

    # Ensure output path resolution and directory creation
    script_dir = Path(__file__).resolve().parent
    if output_path is None:
        # Default to Annotations directory in project root or relative
        proj_annotations = script_dir.parent.parent.parent / "Annotations"
        if proj_annotations.parent.exists():
            output_path_obj = proj_annotations / "annotated_output.jpg"
        else:
            output_path_obj = Path.cwd() / "Annotations" / "annotated_output.jpg"
    else:
        output_path_obj = Path(output_path).resolve()
        
    output_path_obj.parent.mkdir(parents=True, exist_ok=True)

    # --- 1. Gemini Macro-Scoping ---
    env_context = scope_environment(image_path)

    # --- 2. Your Existing YOLO + WBF Pipeline ---
    res_mira = model_mira.predict(source=str(image_path), conf=0.045, iou=0.45, imgsz=imgsz, save=False)[0]
    res_alope = model_alope.predict(source=str(image_path), conf=0.15, iou=0.45, imgsz=imgsz, save=False)[0]

    boxes_list, scores_list, labels_list = [[], []], [[], []], [[], []]

    # Pre-fusion area filter: MIRA
    for box in res_mira.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        if ((x2 - x1) * (y2 - y1)) / total_area > 0.35: continue
        boxes_list[0].append([x1 / img_w, y1 / img_h, x2 / img_w, y2 / img_h])
        scores_list[0].append(float(box.conf[0]))
        labels_list[0].append(int(box.cls[0]))

    # Pre-fusion area filter: ALOPE
    for box in res_alope.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        if ((x2 - x1) * (y2 - y1)) / total_area > 0.35: continue
        boxes_list[1].append([x1 / img_w, y1 / img_h, x2 / img_w, y2 / img_h])
        scores_list[1].append(float(box.conf[0]))
        labels_list[1].append(ALOPE_TO_MASTER[int(box.cls[0])])

    # WBF Fusion (skip_box_thr raised to 0.08 to filter visual noise for the demo)
    boxes, scores, labels = weighted_boxes_fusion(
        boxes_list, scores_list, labels_list, weights=[1, 2.5], iou_thr=0.55, skip_box_thr=0.07
    )

    detections = []
    for box, score, label in zip(boxes, scores, labels):
        x1, y1, x2, y2 = int(box[0] * img_w), int(box[1] * img_h), int(box[2] * img_w), int(box[3] * img_h)
        class_name = MASTER_CLASSES[int(label)]
        superclass = SUPERCLASS_MAP.get(class_name, "Unknown")

        detections.append({
            "label": class_name, "superclass": superclass,
            "confidence": round(float(score), 2), "bbox": [x1, y1, x2, y2]
        })
        
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        display_text = f"{class_name.upper()} [{superclass}]"
        cv2.putText(img, display_text, (x1, max(y1 - 10, 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 2)

    # --- 3. REVISED THREAT EVALUATION ---
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

    cv2.imwrite(str(output_path_obj), img)
    print(f"Annotated image saved to: {output_path_obj}")
    return payload

def resolve_input_image(image_arg: str = None) -> Path:
    """Resolve the input image path, falling back to sample trash photos in assets if none is provided."""
    script_dir = Path(__file__).resolve().parent
    cwd = Path.cwd().resolve()
    
    if image_arg:
        given_path = Path(image_arg)
        if given_path.exists():
            return given_path.resolve()
            
    test_image_names = ["Trash-image-1.jpeg", "Trash-image-1.jpg", "Trash-image-2.jpeg"]
    search_bases = [
        script_dir,
        script_dir.parent,
        script_dir.parent.parent,
        script_dir.parent.parent.parent,
        cwd,
        cwd.parent,
    ]
    
    for base in dict.fromkeys(search_bases):
        for img_name in test_image_names:
            for rel in [
                Path("assets") / "trash-photos" / img_name,
                Path("Pipeline") / "assets" / "trash-photos" / img_name,
                Path("AI") / "Pipeline" / "assets" / "trash-photos" / img_name,
                Path("T10-Cherubim") / "AI" / "Pipeline" / "ai" / img_name,
                Path("T-10 Cherubim") / "AI" / "Pipeline" / "ai" / img_name,
            ]:
                candidate = (base / rel).resolve()
                if candidate.exists():
                    return candidate
                    
    if image_arg:
        raise FileNotFoundError(f"Provided input image not found: {image_arg}")
    raise FileNotFoundError("No sample trash photo found in project assets directory.")

if __name__ == "__main__":
    # Local verification test
    image_arg = sys.argv[1] if len(sys.argv) > 1 else None
    try:
        test_img_path = resolve_input_image(image_arg)
        print(f"Running inference on: {test_img_path}")
        res = analyze_waste_image(str(test_img_path))
        print(json.dumps(res, indent=2))
    except Exception as err:
        print(f"[ERROR] {err}")
        print("Usage: python inference.py [image_path]")
