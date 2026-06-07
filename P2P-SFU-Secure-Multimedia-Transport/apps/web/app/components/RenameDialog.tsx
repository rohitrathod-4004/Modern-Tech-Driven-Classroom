"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface RenameDialogProps {
    isOpen: boolean;
    currentName: string;
    onClose: () => void;
    onRename: (newName: string) => void;
}

export default function RenameDialog({ isOpen, currentName, onClose, onRename }: RenameDialogProps) {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        setName(currentName);
    }, [currentName, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (trimmedName.length > 0 && trimmedName.length <= 50 && trimmedName !== currentName) {
            onRename(trimmedName);
            onClose();
        }
    };

    const isNameValid = name.trim().length > 0 && name.trim().length <= 50;
    const isNameChanged = name.trim() !== currentName;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Change Your Name</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="rename-input" className="block text-sm font-medium text-gray-300 mb-2">
                            New Name
                        </label>
                        <input
                            id="rename-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" && isNameValid && isNameChanged) {
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Enter your new name"
                            maxLength={50}
                            autoFocus
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <div className="mt-2 flex justify-between text-sm">
                            <span className={!isNameValid ? "text-red-400" : "text-gray-500"}>
                                {name.trim().length === 0 ? "Name cannot be empty" : ""}
                            </span>
                            <span className="text-gray-500">{name.length}/50</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isNameValid || !isNameChanged}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
