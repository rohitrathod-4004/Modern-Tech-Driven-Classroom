import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
        return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    try {
        // Forward request to backend server
        const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        const response = await fetch(`${backendUrl}/api/livekit-token?roomId=${roomId}`);

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("LiveKit token fetch error:", error);
        return NextResponse.json(
            { error: "Failed to get LiveKit token" },
            { status: 500 }
        );
    }
}
