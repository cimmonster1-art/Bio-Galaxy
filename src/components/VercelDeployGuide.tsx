import React, { useState } from "react";
import { Cloud, Globe, Check, Copy, ExternalLink, HelpCircle, HardDrive, Terminal } from "lucide-react";

export const VercelDeployGuide: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const vercelJsonCode = `{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  return (
    <div className="flex-1 min-w-0 bg-[#02050c] flex flex-col relative rounded-md border border-white/[0.08] overflow-hidden p-6 text-left overflow-y-auto custom-scrollbar select-none">
      
      {/* Top Header */}
      <div className="border-b border-white/[0.08] pb-4 mb-6 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded bg-cyan-950/20 leading-none">
            Production Deployment Guide
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-wide text-white uppercase font-sans">
          Vercel Deployment and Custom Domains
        </h2>
        <p className="text-slate-450 text-[11.5px] mt-1 line-clamp-2 md:line-clamp-none">
          Configure physical serverless endpoints and route custom namespaces onto Vercel DNS servers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Vercel Config Card */}
        <div className="space-y-4">
          <div className="bg-[#040815] p-5 rounded-lg border border-white/5 space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                1. Single Page Application (SPA) Config
              </span>
              <button
                onClick={() => handleCopy(vercelJsonCode, "config")}
                className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/25 border border-cyan-400/20 px-2 py-1 rounded cursor-pointer transition"
              >
                {copiedText === "config" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy vercel.json</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              Create a <b>vercel.json</b> configuration file in the project root directory to ensure client-side routing redirects properly under clean URL directories.
            </p>
            <pre className="p-3.5 bg-black/50 rounded border border-white/5 font-mono text-[10px] text-indigo-300 leading-normal overflow-x-auto">
              {vercelJsonCode}
            </pre>
          </div>

          <div className="bg-[#040815] p-5 rounded-lg border border-white/5 space-y-3">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">
              2. Command Line Fast Deploy (CLI)
            </span>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              To deploy directly from your local terminal with Vercel CLI, authenticate and trigger the production build command:
            </p>
            <div className="bg-black/50 p-3.5 rounded border border-white/5 space-y-2 font-mono text-[10.5px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>npm install -g vercel</span>
                <button onClick={() => handleCopy("npm install -g vercel", "cli1")} className="text-slate-500 hover:text-slate-200">
                  {copiedText === "cli1" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span>vercel --prod</span>
                <button onClick={() => handleCopy("vercel --prod", "cli2")} className="text-slate-500 hover:text-slate-200">
                  {copiedText === "cli2" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Custom Domains and Nameservers DNS configuration card */}
        <div className="space-y-4">
          <div className="bg-[#040815] p-5 rounded-lg border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                3. Mapping Custom Domains
              </span>
            </div>

            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              After pointing your repository onto Vercel dashboard, navigate to <b>Settings → Domains</b> to bind your custom trademark namespace (e.g., <i>biogalaxy.org</i>).
            </p>

            <div className="space-y-3 border-t border-white/[0.04] pt-3 text-[11px]">
              <div className="flex items-start justify-between bg-black/30 p-3 rounded border border-white/5">
                <div>
                  <span className="font-mono text-slate-500 block uppercase text-[8px]">A record (Apex Domain)</span>
                  <span className="font-mono text-slate-300 font-bold">@ ↔ 76.76.21.21</span>
                </div>
                <button
                  onClick={() => handleCopy("76.76.21.21", "apex")}
                  className="text-xs text-slate-500 hover:text-slate-200 cursor-pointer"
                >
                  {copiedText === "apex" ? "Copied" : "Copy IP"}
                </button>
              </div>

              <div className="flex items-start justify-between bg-black/30 p-3 rounded border border-white/5">
                <div>
                  <span className="font-mono text-slate-500 block uppercase text-[8px]">CNAME record (Subdomain)</span>
                  <span className="font-mono text-slate-300 font-bold">www ↔ cname.vercel-dns.com</span>
                </div>
                <button
                  onClick={() => handleCopy("cname.vercel-dns.com", "cname")}
                  className="text-xs text-slate-500 hover:text-slate-200 cursor-pointer"
                >
                  {copiedText === "cname" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Educational Disclaimer */}
          <div className="bg-[#070c1b] border border-cyan-500/20 p-5 rounded-lg space-y-1.5 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-[10px] uppercase">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Diagnostic Disclaimer</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
              Bio Galaxy is designed primarily for educational visualization, scientific reference modeling, and interactive exploration of molecular structures. <b>It is not built or approved for medical diagnoses, therapeutic guidance, clinical consultations, or active treatment determinations.</b>
            </p>
          </div>
        </div>

      </div>

      <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
        <span>BIO GALAXY DISTRIBUTION MATRIX</span>
        <span>PRODUCTION VERIFIED</span>
      </div>

    </div>
  );
};
