'use client';

import { useState, useRef } from "react";
import { Camera, RefreshCw, Loader2, Sparkles, TrendingUp, DollarSign } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WatchDetailsCard } from "./watch-card";

// Updated Data Structures
interface WatchData {
    id: number;
    brand_model_series: string;
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

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Loading Messages
    const loadingMessages = [
        "正在连线瑞士天文台...",
        "正在翻阅佳士得拍卖记录...",
        "正在对比百达翡丽档案...",
        "正在检测机芯打磨工艺...",
        "正在计算溢价指数...",
        "正在分析表盘氧化程度...",
        "正在识别贵金属印记..."
    ];

    // Helpers
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Reset state
        setResultData(null);
        setTimer(0.0);
        setLoadingText(loadingMessages[0]);

        // Setup local preview for ALL selected files
        const urls = Array.from(files).map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
        setIsLoading(true);

        // Start Timer & Text Rotation
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setTimer(elapsed);

            // Rotate text every 2.0 seconds
            const msgIndex = Math.floor(elapsed / 2.0) % loadingMessages.length;
            setLoadingText(loadingMessages[msgIndex]);
        }, 100);

        try {
            // 1. Prepare User Message with Base64 Images
            const attachments = await Promise.all(
                Array.from(files).map(async (file) => ({
                    name: file.name,
                    contentType: file.type,
                    url: await fileToBase64(file)
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

                            {/* Loading Overlay */}
                            {isLoading && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
                                    <Loader2 className="w-16 h-16 text-brand-yellow animate-spin mb-6" />
                                    <div className="text-center space-y-3 px-6">
                                        <h3 className="text-2xl font-bold text-brand-yellow animate-pulse drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                                            {loadingText}
                                        </h3>
                                        <p className="text-zinc-300 font-mono text-lg font-semibold">
                                            {timer.toFixed(1)}s
                                        </p>
                                    </div>
                                </div>
                            )}
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
