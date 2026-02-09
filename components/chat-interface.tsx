'use client';

import { useState, useRef } from "react";
import { Camera, RefreshCw, Sparkles, TrendingUp, DollarSign } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WatchDetailsCard } from "./watch-card";

// Updated Data Structures
interface WatchData {
    id: number;
    brand_model_series: string;
    serial: string;
    price_estimate: string;
    sharp_comment: string;
    heritage_story: string;
    occasions: string[];
    is_watch: boolean;
}

interface ComparisonData {
    summary: string;
    most_expensive_id: number;
    best_value_id: number;
}

interface AIResponse {
    watches: WatchData[];
    comparison: ComparisonData;
}

export function ChatInterface() {
    // State
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState<AIResponse | null>(null);
    const [timer, setTimer] = useState<number>(0.0);
    const [loadingText, setLoadingText] = useState("正在连线瑞士天文台...");
    const [progress, setProgress] = useState<number>(0);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<NodeJS.Timeout | null>(null);

    // Loading Phases with percentage ranges
    const loadingPhases = [
        { text: "正在压缩图像数据...", start: 0, end: 8 },
        { text: "正在上传至AI服务器...", start: 8, end: 15 },
        { text: "正在连线瑞士天文台...", start: 15, end: 22 },
        { text: "正在初始化视觉识别引擎...", start: 22, end: 30 },
        { text: "正在扫描表盘细节特征...", start: 30, end: 38 },
        { text: "正在识别品牌标志与LOGO...", start: 38, end: 45 },
        { text: "正在检测机芯打磨工艺...", start: 45, end: 52 },
        { text: "正在对比百达翡丽档案...", start: 52, end: 58 },
        { text: "正在翻阅佳士得拍卖记录...", start: 58, end: 65 },
        { text: "正在查询ctime.com数据库...", start: 65, end: 72 },
        { text: "正在计算中国市场溢价指数...", start: 72, end: 78 },
        { text: "正在分析二级市场成交价...", start: 78, end: 84 },
        { text: "正在生成毒舌鉴定报告...", start: 84, end: 90 },
        { text: "正在润色犀利点评文案...", start: 90, end: 95 },
        { text: "即将完成，最终校验中...", start: 95, end: 99 },
    ];

    // Helpers: Compress image using Canvas before converting to base64
    const compressImage = (file: File, maxSize = 1024, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                // Calculate new dimensions (maintain aspect ratio)
                let { width, height } = img;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }
                // Draw to canvas and export as compressed JPEG
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas not supported')); return; }
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                console.log(`[Compress] ${file.name}: ${(file.size / 1024).toFixed(0)}KB -> ~${(compressedBase64.length * 0.75 / 1024).toFixed(0)}KB (${width}x${height})`);
                resolve(compressedBase64);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
            img.src = url;
        });
    };

    const startProgress = () => {
        let currentProgress = 0;
        let phaseIndex = 0;

        setProgress(0);
        setLoadingText(loadingPhases[0].text);

        progressRef.current = setInterval(() => {
            // Find current phase
            while (phaseIndex < loadingPhases.length - 1 && currentProgress >= loadingPhases[phaseIndex].end) {
                phaseIndex++;
            }

            const phase = loadingPhases[phaseIndex];
            setLoadingText(phase.text);

            // Calculate increment: slower as we approach 99%
            let increment: number;
            if (currentProgress < 30) {
                increment = 0.3 + Math.random() * 0.5; // Fast: 0.3-0.8 per tick
            } else if (currentProgress < 60) {
                increment = 0.2 + Math.random() * 0.4; // Medium: 0.2-0.6
            } else if (currentProgress < 85) {
                increment = 0.1 + Math.random() * 0.3; // Slow: 0.1-0.4
            } else if (currentProgress < 95) {
                increment = 0.05 + Math.random() * 0.15; // Very slow: 0.05-0.2
            } else {
                increment = 0.02 + Math.random() * 0.08; // Crawl: 0.02-0.1
            }

            currentProgress = Math.min(currentProgress + increment, 99);
            setProgress(currentProgress);
        }, 100);
    };

    const stopProgress = () => {
        if (progressRef.current) {
            clearInterval(progressRef.current);
            progressRef.current = null;
        }
        // Snap to 100%
        setProgress(100);
        setLoadingText("分析完成！");
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Reset state
        setResultData(null);
        setTimer(0.0);
        setProgress(0);

        // Setup local preview for ALL selected files
        const urls = Array.from(files).map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
        setIsLoading(true);

        // Start Timer
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setTimer(elapsed);
        }, 100);

        // Start Progress
        startProgress();

        try {
            // 1. Prepare User Message with Base64 Images
            const attachments = await Promise.all(
                Array.from(files).map(async (file) => ({
                    name: file.name,
                    contentType: file.type,
                    url: await compressImage(file)
                }))
            );

            const userMsg = {
                role: 'user',
                content: '请识别这些手表',
                experimental_attachments: attachments
            };

            // 2. Perform Fetch Request
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [userMsg]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || 'Network response was not ok';
                throw new Error(errorMessage);
            }
            if (!response.body) throw new Error('No body');

            // 3. Handle JSON Response (Structured Data)
            const data = await response.json();

            if (!data.content) {
                alert("识别未返回结果，请检查图片或网络后重试。");
            } else {
                try {
                    const parsedData: AIResponse = JSON.parse(data.content);
                    console.log("Frontend received:", parsedData);
                    setResultData(parsedData);
                } catch (parseError) {
                    console.error("Failed to parse AI JSON:", parseError);
                    alert("AI返回数据格式有误，请重试");
                }
            }

        } catch (err: any) {
            console.error("Submit error:", err);
            alert(`识别失败: ${err.message || "请检查网络"}`);
        } finally {
            stopProgress();
            // Small delay to show 100% before hiding
            await new Promise(r => setTimeout(r, 500));
            setIsLoading(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleReset = () => {
        setResultData(null);
        setPreviewUrls([]);
        setTimer(0.0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn(
            "flex flex-col bg-black text-white relative",
            previewUrls.length > 0 ? "min-h-[100dvh]" : "h-[100dvh] overflow-hidden"
        )}>
            {/* Background Elements for 'Black Gold' vibe */}
            <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-yellow/10 to-transparent pointer-events-none" />

            <div className={cn(
                "flex-1 flex flex-col w-full max-w-2xl mx-auto z-10 transition-all duration-500",
                previewUrls.length > 0 ? "justify-start pt-28" : "items-center justify-center p-4"
            )}>

                {/* IDLE STATE: No image uploaded */}
                {previewUrls.length === 0 && (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-48 h-48 rounded-full border-2 border-dashed border-brand-yellow/30 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all hover:scale-105 hover:border-brand-yellow relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 flex flex-wrap gap-1 p-8 opacity-20 pointer-events-none">
                                    <div className="w-full h-full bg-brand-yellow/20 rounded-full blur-xl" />
                                </div>
                                <Camera className="w-16 h-16 text-brand-yellow/80 relative z-10" />
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-black px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap shadow-lg shadow-brand-yellow/20">
                                拍个照 / 选多图
                            </div>
                        </div>

                        <div className="text-center space-y-2 max-w-md">
                            <h2 className="text-2xl font-bold text-white">识别您的珍藏</h2>
                            <p className="text-zinc-400 text-sm">
                                支持单张或多张上传，【表态】AI 将为您鉴定品牌、型号，并进行独家 VS 对比点评。
                            </p>
                        </div>
                    </div>
                )}

                {/* ANALYSIS STATE: Images uploaded */}
                {previewUrls.length > 0 && (
                    <div className="w-full flex-1 flex flex-col items-center gap-6 px-4 pb-32">

                        {/* Image Grid Display */}
                        <div className="relative w-full max-w-lg mb-4">
                            <div className={cn(
                                "grid gap-3",
                                previewUrls.length === 1 ? "grid-cols-1 justify-items-center" : "grid-cols-3 sm:grid-cols-4"
                            )}>
                                {previewUrls.map((url, idx) => (
                                    <div key={idx} className={cn(
                                        "relative rounded-xl overflow-hidden border-2 border-brand-yellow/50 shadow-xl shadow-brand-yellow/10",
                                        previewUrls.length === 1 ? "w-32 h-32" : "aspect-square w-full"
                                    )}>
                                        <Image
                                            src={url}
                                            alt={`Watch Preview ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>


                        </div>

                        {/* RESULT SECTION */}
                        {resultData && !isLoading && (
                            <div className="w-full space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-700">

                                {/* 1. Comparison Summary Card (Only if multiple watches) */}
                                {resultData.watches.length > 1 && (
                                    <div className="w-full bg-gradient-to-br from-brand-yellow/10 to-transparent border border-brand-yellow/30 rounded-2xl p-6 text-zinc-100 shadow-xl">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="w-5 h-5 text-brand-yellow" />
                                            <h3 className="font-bold text-brand-yellow text-lg">巅峰对决 · 表态点评</h3>
                                        </div>
                                        <p className="text-zinc-200 text-sm leading-relaxed mb-4">
                                            {resultData.comparison.summary}
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-xs text-brand-yellow/80 bg-brand-yellow/10 px-3 py-1.5 rounded-lg border border-brand-yellow/20">
                                                <DollarSign className="w-3 h-3" />
                                                <span>最壕战力</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-green-400/80 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                                <TrendingUp className="w-3 h-3" />
                                                <span>性价比之王</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. Watch Cards Loop */}
                                {resultData.watches.map((watch) => {
                                    // Determine Badges
                                    const badges = [];
                                    if (resultData.comparison.most_expensive_id === watch.id && resultData.watches.length > 1) {
                                        badges.push({ text: "💰 最贵壕物", color: "bg-brand-yellow text-black" });
                                    }
                                    if (resultData.comparison.best_value_id === watch.id && resultData.watches.length > 1) {
                                        badges.push({ text: "✨ 性价比之王", color: "bg-green-600 text-white" });
                                    }

                                    return (
                                        <WatchDetailsCard key={watch.id} data={watch} badges={badges} />
                                    );
                                })}

                            </div>
                        )}

                        {/* Actions */}
                        {!isLoading && resultData && (
                            <button
                                onClick={handleReset}
                                className="mt-4 flex items-center gap-2 px-8 py-3 bg-brand-yellow text-black rounded-full font-bold hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-brand-yellow/20"
                            >
                                <RefreshCw className="w-4 h-4" />
                                识别下一组
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* High-End Loading Overlay (Fixed Full Screen) */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
                    {/* 1. Radar Scanner Effect */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]" />
                        <div className="w-full h-1 bg-brand-yellow/50 absolute top-0 animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                    </div>

                    {/* 2. Central HUD */}
                    <div className="relative z-10 flex flex-col items-center scale-110">
                        {/* Outer Ring */}
                        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                            {/* Spinning Rings */}
                            <div className="absolute inset-0 border-2 border-brand-yellow/20 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-4 border border-brand-yellow/10 rounded-full border-t-transparent animate-[spin_4s_linear_infinite_reverse]" />
                            <div className="absolute inset-0 rounded-full border border-brand-yellow/5 animate-pulse" />

                            {/* Percentage */}
                            <div className="flex flex-col items-center justify-center z-20">
                                <span className="text-7xl font-black text-brand-yellow tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                                    {Math.floor(progress)}
                                    <span className="text-3xl align-top ml-1">%</span>
                                </span>
                                <span className="text-xs text-brand-yellow/60 uppercase tracking-[0.3em] animate-pulse mt-2 font-mono">
                                    System Analysis
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar (Technical Style) */}
                        <div className="w-80 h-1.5 bg-zinc-900 rounded-none mb-6 relative overflow-hidden border-x border-brand-yellow/20">
                            <div
                                className="absolute top-0 left-0 h-full bg-brand-yellow shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Phase Text & Data Stream */}
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-brand-yellow tracking-widest uppercase drop-shadow-md">
                                {loadingText}
                            </h3>
                            <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-ping" />
                                    LIVE
                                </span>
                                <span>|</span>
                                <span>T: {timer.toFixed(1)}s</span>
                                <span>|</span>
                                <span className="text-brand-yellow/80">CPU: {Math.floor(Math.random() * 30 + 40)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Decorative HUD Corners (Expanded) */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-brand-yellow/40" />
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-brand-yellow/40" />
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-brand-yellow/40" />
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-brand-yellow/40" />

                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,183,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,183,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </div>
    );
}
