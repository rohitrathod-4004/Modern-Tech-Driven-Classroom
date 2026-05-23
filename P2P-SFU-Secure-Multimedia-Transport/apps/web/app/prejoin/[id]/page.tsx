"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import PreJoinScreen from "../../components/PreJoinScreen";

export default function PreJoinPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    const handleJoin = (name: string, stream: MediaStream) => {
        // Navigate to room with name in state
        router.push(`/room/${roomId}?name=${encodeURIComponent(name)}`);
    };

    return <PreJoinScreen roomId={roomId} onJoin={handleJoin} />;
}
