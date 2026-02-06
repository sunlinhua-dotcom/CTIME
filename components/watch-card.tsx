import { Badge } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface WatchData {
    brand_model_series: string;
    serial?: string;
    price_estimate: string;
    sharp_comment: string;
    heritage_story: string;
    occasions: string[];
    is_watch: boolean;
}


interface WatchDetailsCardProps {
    data: WatchData;
    badges?: {
        text: string;
        color: string; // e.g. "bg-red-500", "bg-green-500"
    }[];
}

export function WatchDetailsCard({ data, badges }: WatchDetailsCardProps) {
    if (!data.is_watch) {
        return (
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-200 shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-500">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    🚫 鉴定失败
                </h3>
                <p className="whitespace-pre-wrap leading-relaxed opacity-90">
                    {data.sharp_comment || "这似乎不是一块手表哦，请上传正确的手表图片。"}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-500 backdrop-blur-md">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-brand-yellow/20 to-transparent p-6 border-b border-white/5 relative">
                {badges && badges.length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                        {badges.map((badge, idx) => (
                            <span key={idx} className={cn("px-3 py-1 text-xs font-bold rounded-full text-white shadow-lg animate-pulse", badge.color)}>
                                {badge.text}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <span className="text-brand-yellow text-xs font-bold tracking-widest uppercase">
                        BIAOTAI AUTHENTICATED
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight pr-8">
                        {data.brand_model_series}
                    </h2>
                    {data.serial && data.serial !== 'unknown' && (
                        <div className="text-zinc-500 text-xs font-mono tracking-wider">
                            MODEL: {data.serial}
                        </div>
                    )}
                    <div className="inline-flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-brand-yellow text-black text-sm font-bold rounded-full shadow-lg shadow-brand-yellow/20">
                            {data.price_estimate}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body Section */}
            <div className="p-6 space-y-6">

                {/* Sharp Comment */}
                <div className="space-y-2">
                    <h3 className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                        <span className="w-1 h-4 bg-brand-yellow rounded-full" />
                        表态犀利点评
                    </h3>
                    <p className="text-zinc-100 leading-relaxed italic border-l-2 border-brand-yellow/30 pl-4 py-1">
                        “{data.sharp_comment}”
                    </p>
                </div>

                {/* Heritage Story */}
                {data.heritage_story && (
                    <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="text-zinc-400 text-sm font-medium">📜 品牌故事 / 冷知识</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed opacity-80">
                            {data.heritage_story}
                        </p>
                    </div>
                )}

                {/* Occasions */}
                {data.occasions && data.occasions.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            最佳佩戴场合
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {data.occasions.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-lg border border-white/10"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-black/40 p-3 text-center border-t border-white/5">
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
                    Generated by Ctime.com AI • Market prices are for reference only
                </p>
            </div>
        </div>
    );
}
