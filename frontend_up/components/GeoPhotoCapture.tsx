"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Camera, MapPin, UploadCloud, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

interface GeoPhotoCaptureProps {
  jobId: string
  type: "start" | "end"
  onPhotoUpload: (photoUrl: string, latitude: number, longitude: number, addressName: string | null, type: "start" | "end") => void
  onCancel?: () => void
  disabled?: boolean
}

const GeoPhotoCapture: React.FC<GeoPhotoCaptureProps> = ({ jobId, type, onPhotoUpload, onCancel, disabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [addressName, setAddressName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const startCamera = useCallback(async () => {
    setError("")
    setPhoto(null)
    setLocation(null)
    setAddressName(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        try {
          await videoRef.current.play()
        } catch (playError) {
          console.warn("Video play interrupted:", playError)
        }
      }
      setStream(mediaStream)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Failed to access camera. Please ensure permissions are granted.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    const setupCamera = async () => {
      setError("");
      setPhoto(null);
      setLocation(null);
      setAddressName(null);
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn("Video play interrupted:", playError);
          }
        }
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Failed to access camera. Please ensure permissions are granted.");
      }
    };

    const cleanupCamera = () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };

    if (!disabled) {
      setupCamera();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [disabled]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && location) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        const video = videoRef.current;
        canvasRef.current.width = video.videoWidth
        canvasRef.current.height = video.videoHeight

        // 1. Draw Camera Image
        context.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height)

        // 2. Configure Overlay (Professional Dark Bar)
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const barHeight = height * 0.22; // Bottom 22% for data

        // Draw semi-transparent background (Gradient for better text readability)
        const gradient = context.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
        context.fillStyle = gradient;
        context.fillRect(0, height - barHeight, width, barHeight);

        // 3. Draw Text Data
        const padding = width * 0.03; // 3% padding
        // Responsive font calculation (min 12px, max 3% of width)
        const fontSize = Math.max(12, Math.min(24, width * 0.03));
        context.font = `bold ${fontSize}px sans-serif`;
        context.fillStyle = "#ffffff";
        context.textBaseline = "top";

        let currentY = height - barHeight + padding;
        const lineHeight = fontSize * 1.6;

        // -- Data Row 1: Timestamp --
        const timestamp = new Date().toLocaleString('en-IN', {
          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        context.fillText(`🕒 ${timestamp}`, padding, currentY);
        currentY += lineHeight;

        // -- Data Row 2: Coordinates --
        const coordsText = `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        // Only show accuracy if available
        const accuracyText = (location as any).accuracy ? `(±${Math.round((location as any).accuracy)}m)` : "";
        context.fillText(coordsText + " " + accuracyText, padding, currentY);
        currentY += lineHeight;

        // -- Data Row 3: Address (Auto-wrapping) --
        // Use a slightly lighter font weight or color for address if desired
        const addressText = addressName ? `🏠 ${addressName}` : "🏠 Address not available";
        const maxTextWidth = width - (padding * 2);

        const words = addressText.split(' ');
        let line = '';

        // Ensure at least one line of address fits; if too long, truncate efficiently
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          if (metrics.width > maxTextWidth && n > 0) {
            context.fillText(line, padding, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
            // Stop if we exceed the bar height (prevent drawing off-canvas)
            if (currentY + lineHeight > height) {
              line = "..." + line; // Indicate truncation visually if possible, though handling this ideally requires more complex logic
              break;
            }
          } else {
            line = testLine;
          }
        }
        context.fillText(line, padding, currentY);

        // 4. Save to State
        const imageData = canvasRef.current.toDataURL("image/png")
        setPhoto(imageData)
        stopCamera()
      }
    } else {
      setError("Please ensure location is available before capturing photo.")
    }
  }, [stopCamera, location, addressName])

  const getLocation = useCallback(async () => {
    setError("")
    setAddressName(null)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy // Capture accuracy
          };
          setLocation(newLocation);

          try {
            const geoResponse = (await apiClient.reverseGeocode(newLocation.latitude, newLocation.longitude)) as any;
            setAddressName(geoResponse.address);
          } catch (geoError: any) {
            console.error("Error during reverse geocoding:", geoError);
            setAddressName("Address not found");
          }
        },
        (err) => {
          console.error("Error getting location:", err.code, err.message)
          setError(`Failed to get location: ${err.message || 'Permissions denied or location unavailable'}. Please ensure location services are enabled.`)
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      )
    } else {
      setError("Geolocation is not supported by this browser.")
    }
  }, [])

  useEffect(() => {
    if (!disabled) {
      getLocation()
    }
  }, [disabled, getLocation])

  const uploadPhoto = useCallback(async () => {
    if (!photo || !location) {
      setError("Please capture a photo and ensure location is available.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const blob = await (await fetch(photo)).blob()
      const formData = new FormData()
      formData.append("file", blob, `job-${jobId}-${type}-${Date.now()}.png`)

      const uploadResponse: any = await apiClient.uploadFile(formData)

      if (uploadResponse && uploadResponse.fileUrl) {
        onPhotoUpload(uploadResponse.fileUrl, location.latitude, location.longitude, addressName, type)
      } else {
        throw new Error("File upload response did not contain a valid 'fileUrl'.");
      }

      setPhoto(null)
      setLocation(null)
      setAddressName(null)
    } catch (err: any) {
      setError(err.message || "Failed to upload photo.")
    } finally {
      setLoading(false)
    }
  }, [photo, location, addressName, jobId, type, onPhotoUpload])

  return (
    <Card className="p-6 bg-card border-border relative">
      {onCancel && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive z-10"
          onClick={onCancel}
        >
          <XCircle className="w-5 h-5" />
        </Button>
      )}
      <CardContent className="px-0 pb-0 space-y-4">
        {error && (
          <div className="mb-4 p-2 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
            {error}
          </div>
        )}

        {!photo ? (
          <>
            <div className="relative w-full bg-black rounded-xl overflow-hidden flex items-center justify-center aspect-[3/4] sm:aspect-video shadow-inner">
              {stream ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center animate-pulse">
                  <Camera className="w-12 h-12 mb-4 opacity-50" />
                  <span className="font-medium">Initializing Camera...</span>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
            <Button onClick={capturePhoto} disabled={!stream || disabled || !location} className="w-full h-12 text-lg font-bold rounded-xl shadow-md active:scale-95 transition-all">
              <Camera className="w-5 h-5 mr-2" /> Capture Photo
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Simplified Image Container - No extra borders/padding */}
            <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-sm">
              <img src={photo} alt="Captured" className="w-full h-auto object-contain max-h-[80vh]" />
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-2 border border-border/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location Tag</p>
                  {location ? (
                    <div className="text-sm">
                      {addressName && <p className="font-medium text-foreground leading-snug mb-1">{addressName}</p>}
                      {location && <p className="text-xs text-muted-foreground font-mono bg-background/50 inline-block px-2 py-1 rounded-md border border-border/50">
                        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                      </p>}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Location data pending...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Simple Grid for Actions - Removed Location Box */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPhoto(null)
                  startCamera()
                }}
                className="h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 font-bold"
              >
                Retake
              </Button>
              <Button
                onClick={uploadPhoto}
                disabled={loading || disabled || !location}
                className="h-12 rounded-xl text-base font-bold shadow-md bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 mr-2" /> Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GeoPhotoCapture