'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface ProfilePhotoUploadProps {
    currentPhotoUrl?: string;
    onPhotoUploaded: (url: string) => void;
    userId?: string; // Optional - for registered users
    tempId?: string; // Optional - for registration flow
    disabled?: boolean;
}

// Maximum dimensions for profile photos
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const TARGET_SIZE_KB = 500; // Target compressed size in KB
const MAX_SIZE_KB = 1024; // Max size after compression (1MB)

/**
 * Compress an image file while preserving quality
 * Uses canvas to resize and compress the image
 */
async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Use high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw the image
            ctx.drawImage(img, 0, 0, width, height);

            // Start with high quality and reduce if needed
            let quality = 0.92;
            const minQuality = 0.5;
            const qualityStep = 0.05;

            const tryCompress = () => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        const sizeKB = blob.size / 1024;

                        // If size is acceptable or we've reached minimum quality, use this blob
                        if (sizeKB <= TARGET_SIZE_KB || quality <= minQuality) {
                            console.log(`Compressed image: ${sizeKB.toFixed(0)}KB at quality ${quality.toFixed(2)}`);
                            resolve(blob);
                            return;
                        }

                        // If still too large but under max, use it
                        if (sizeKB <= MAX_SIZE_KB && quality < 0.8) {
                            console.log(`Compressed image: ${sizeKB.toFixed(0)}KB at quality ${quality.toFixed(2)}`);
                            resolve(blob);
                            return;
                        }

                        // Try again with lower quality
                        quality -= qualityStep;
                        tryCompress();
                    },
                    'image/jpeg',
                    quality
                );
            };

            tryCompress();
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Load the image from file
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

export default function ProfilePhotoUpload({
    currentPhotoUrl,
    onPhotoUploaded,
    userId,
    tempId,
    disabled = false,
}: ProfilePhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [compressionStatus, setCompressionStatus] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use the preview URL if available, otherwise use the current photo URL
    const displayUrl = previewUrl || currentPhotoUrl;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setCompressionStatus('');

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Create a preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);

        try {
            // Compress the image
            const originalSizeKB = file.size / 1024;
            setCompressionStatus(`Compressing ${originalSizeKB.toFixed(0)}KB image...`);

            const compressedBlob = await compressImage(file);
            const compressedSizeKB = compressedBlob.size / 1024;

            if (originalSizeKB > compressedSizeKB) {
                setCompressionStatus(`Compressed: ${originalSizeKB.toFixed(0)}KB → ${compressedSizeKB.toFixed(0)}KB`);
            } else {
                setCompressionStatus('');
            }

            // Determine the storage path
            let storagePath: string;
            const fileName = file.name.replace(/\.[^/.]+$/, '.jpg'); // Change extension to .jpg

            if (userId) {
                storagePath = `profile-photos/${userId}/${Date.now()}_${fileName}`;
            } else if (tempId) {
                storagePath = `pending-profile-photos/${tempId}/${Date.now()}_${fileName}`;
            } else {
                // Generate a temporary ID for new registrations
                const newTempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                storagePath = `pending-profile-photos/${newTempId}/${fileName}`;
            }

            const storageRef = ref(storage, storagePath);

            // Upload the compressed file
            const snapshot = await uploadBytes(storageRef, compressedBlob, {
                contentType: 'image/jpeg',
            });

            // Get the download URL
            const downloadUrl = await getDownloadURL(snapshot.ref);

            onPhotoUploaded(downloadUrl);
            setPreviewUrl(null); // Clear preview since we now have the actual URL
            setCompressionStatus('');
        } catch (err) {
            console.error('Failed to upload photo:', err);
            setError('Failed to upload photo. Please try again.');
            setPreviewUrl(null);
            setCompressionStatus('');
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!currentPhotoUrl) return;

        try {
            // Try to delete from storage if it's a Firebase Storage URL
            if (currentPhotoUrl.includes('firebasestorage.googleapis.com') ||
                currentPhotoUrl.includes('firebasestorage.app')) {
                const photoRef = ref(storage, currentPhotoUrl);
                await deleteObject(photoRef).catch(() => {
                    // Ignore deletion errors - file might not exist or user might not have permission
                });
            }

            onPhotoUploaded('');
            setPreviewUrl(null);
        } catch (err) {
            console.error('Failed to remove photo:', err);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-[#00245D] mb-1.5">
                Profile Photo (Optional)
            </label>

            <div className="flex items-center gap-4">
                {/* Photo Preview */}
                <div
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[#D4C4A8] flex items-center justify-center overflow-hidden bg-[#F5F0E8] cursor-pointer hover:border-[#00245D] transition-colors"
                    onClick={!disabled && !uploading ? triggerFileInput : undefined}
                >
                    {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00245D] border-t-transparent"></div>
                    ) : displayUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={displayUrl}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <svg className="w-8 h-8 text-[#D4C4A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    )}
                </div>

                {/* Upload/Remove Buttons */}
                <div className="flex flex-col gap-2 flex-1">
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={disabled || uploading}
                        className="px-4 py-2.5 border-2 border-[#D4C4A8] rounded-xl text-[#00245D] font-medium hover:bg-[#D4C4A8]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#00245D] border-t-transparent"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {displayUrl ? 'Change Photo' : 'Upload Photo'}
                            </>
                        )}
                    </button>

                    {displayUrl && (
                        <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={disabled || uploading}
                            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Remove Photo
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || uploading}
            />

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}

            {/* Helper text */}
            <p className="text-xs text-[#00245D]/50">
                Accepts JPG, PNG, GIF, WebP
            </p>
        </div>
    );
}
