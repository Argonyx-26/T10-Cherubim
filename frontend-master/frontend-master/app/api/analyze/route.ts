import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const incomingFormData = await req.formData();
    const imageFile = (incomingFormData.get("image") || incomingFormData.get("file")) as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append("image", imageFile, imageFile.name || "upload.jpg");

    // Forward to Flask backend AI server on port 5000
    const flaskResponse = await fetch("http://127.0.0.1:5000/api/analyze", {
      method: "POST",
      body: outgoingFormData,
    });

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      console.error("[Next.js Proxy Error] Flask returned:", flaskResponse.status, errorText);
      return NextResponse.json(
        { error: `AI Backend server error (${flaskResponse.status}): ${errorText}` },
        { status: flaskResponse.status }
      );
    }

    const data = await flaskResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Next.js Proxy Error] Failed to connect to Flask AI backend:", error);
    return NextResponse.json(
      { error: `Failed to connect to AI Backend server (http://127.0.0.1:5000): ${error.message}` },
      { status: 500 }
    );
  }
}
