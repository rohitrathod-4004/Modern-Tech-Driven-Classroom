"use client";

if (typeof window !== 'undefined') {
    window.global = window;
    window.process = window.process || { env: {} } as any;
    if (!window.Buffer) {
        try {
            window.Buffer = require('buffer').Buffer;
        } catch (e) {
            console.warn("Failed to load buffer polyfill", e);
        }
    }
}
