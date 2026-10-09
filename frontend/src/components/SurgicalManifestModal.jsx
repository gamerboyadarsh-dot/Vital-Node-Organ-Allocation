import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  X,
  Dna,
  Lock,
  Thermometer,
  Activity
} from 'lucide-react';
import { playUiSound } from '../utils/audioFeedback';

export default function SurgicalManifestModal({ isOpen, onClose, allocationData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleAllocation = allocationData || {
    manifestId: 'VN-CHAIN-2026-8941A',
    timestamp: new Date().toISOString(),
    cryptoHash: '9e8b17c38f4201a09d3b8417c49b6e82f501d6748bc9284fae10948b8192a71d',
    organ: 'Kidney (Left Graft)',
    donor: {
      name: 'Donor Node D-104 (Deceased Donor)',
      bloodGroup: 'O-',
      age: 34,
      hospital: 'Mount Sinai Hospital, NY',
      crossClampTime: '2026-10-08 14:15:00 UTC',
      dri: '1.14 (Low Risk)',
      hla: { a: '02, 24', b: '07, 44', c: '07, 16', drb1: '04, 15', dqb1: '03, 06' }
    },
    recipient: {
      name: 'Sarah Jenkins (Priority Rank #1)',
      bloodGroup: 'O-',
      age: 41,
      hospital: 'Bellevue Medical Center, NY',
      urgencyScore: 9.2,
      hla: { a: '02, 24', b: '07, 44', c: '07, 16', drb1: '04, 11', dqb1: '03, 06' }
    },
    transport: {
      carrier: 'Air Medevac Vector MEDEVAC-704',
      transitTimeMinutes: 28,
      podTemp: '3.8°C',
      chainOfCustodyOfficer: 'Dr. Evelyn Carter, UNOS Certified Coordinator',
      status: 'VERIFIED & CROSS-CLAMP CERTIFIED'
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sampleAllocation.cryptoHash);
    setCopied(true);
    playUiSound('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    playUiSound('click');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-1 border border-line w-full max-w-3xl max-h-[92vh] rounded-[28px] overflow-hidden shadow-2xl flex flex-col font-sans">
        {/* Manifest Header */}
        <div className="p-4 px-6 border-b border-line flex items-center justify-between bg-surface-0/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-ink-primary tracking-tight">
                  CLINICAL ORGAN ALLOCATION DOSSIER
                </h2>
                <span className="augen-tag border-emerald-500 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CRYPTOGRAPHICALLY SEALED
                </span>
              </div>
              <p className="text-xs text-ink-secondary font-mono mt-0.5">
                Official Chain of Custody &amp; Surgical Acceptance Protocol • Document #{sampleAllocation.manifestId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 border border-line text-ink-secondary hover:text-ink-primary text-xs font-mono transition-all flex items-center gap-1.5"
              title="Print official clinical manifest"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-2 text-ink-secondary hover:text-ink-primary transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Manifest Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-surface-1 text-ink-primary print:p-0">
          {/* Certificate Header Banner */}
          <div className="p-4 rounded-2xl bg-surface-0 border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-ink-muted block tracking-widest">
                IMMUTABLE AUDIT RECORD ID
              </span>
              <p className="text-lg font-mono font-bold text-ink-primary tracking-tight">
                {sampleAllocation.manifestId}
              </p>
              <p className="text-xs text-ink-secondary font-mono">
                Issued: {new Date(sampleAllocation.timestamp).toUTCString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-surface-2 border border-line flex items-center justify-center p-2 text-ink-primary">
                <QrCode className="w-full h-full text-signal-info" />
              </div>
              <div className="text-[10px] font-mono text-ink-muted">
                <p className="text-emerald-500 font-bold">SHA-256 VERIFIED</p>
                <p>UNOS / OPTN Bylaws</p>
                <p>HIPAA Safe Harbor</p>
              </div>
            </div>
          </div>

          {/* SHA-256 Ledger Hash Strip */}
          <div className="p-2.5 px-3 rounded-xl bg-surface-0 border border-line flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <Lock className="w-3.5 h-3.5 text-signal-info shrink-0" />
              <span className="text-ink-muted shrink-0">BLOCKCHAIN SEAL:</span>
              <span className="text-ink-primary truncate font-semibold">
                {sampleAllocation.cryptoHash}
              </span>
            </div>
            <button
              onClick={handleCopyHash}
              className="ml-2 text-signal-info hover:text-blue-400 shrink-0 text-xs flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Donor vs Recipient Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donor Dossier */}
            <div className="panel p-4 bg-surface-0 border-line space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <h3 className="text-xs font-bold font-mono text-ink-primary uppercase tracking-wider">
                  Donor Node Specifications
                </h3>
                <span className="augen-tag">DONOR</span>
              </div>
              <div className="text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Identity:</span>
                  <span className="font-semibold text-ink-primary">{sampleAllocation.donor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">ABO / Rh Blood:</span>
                  <span className="font-bold text-signal-stable">{sampleAllocation.donor.bloodGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Age / Risk Index:</span>
                  <span>{sampleAllocation.donor.age}y • DRI {sampleAllocation.donor.dri}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Cross-Clamp Time:</span>
                  <span className="text-cyan-400 font-semibold">{sampleAllocation.donor.crossClampTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Donor Center:</span>
                  <span className="text-ink-primary truncate max-w-[160px]">{sampleAllocation.donor.hospital}</span>
                </div>
              </div>
            </div>

            {/* Recipient Dossier */}
            <div className="panel p-4 bg-surface-0 border-line space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <h3 className="text-xs font-bold font-mono text-ink-primary uppercase tracking-wider">
                  Allocated Recipient Candidate
                </h3>
                <span className="augen-tag border-cyan-500 text-cyan-400">RECIPIENT</span>
              </div>
              <div className="text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Candidate Name:</span>
                  <span className="font-semibold text-ink-primary">{sampleAllocation.recipient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">ABO / Rh Blood:</span>
                  <span className="font-bold text-signal-stable">{sampleAllocation.recipient.bloodGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Candidate Age:</span>
                  <span>{sampleAllocation.recipient.age} Years Old</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Priority Severity Score:</span>
                  <span className="font-bold text-amber-400">{sampleAllocation.recipient.urgencyScore} / 10.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Transplant Center:</span>
                  <span className="text-ink-primary truncate max-w-[160px]">{sampleAllocation.recipient.hospital}</span>
                </div>
              </div>
            </div>
          </div>

          {/* HLA Tissue Typing Crossmatch Table */}
          <div className="panel p-4 bg-surface-0 border-line space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-xs font-bold font-mono text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-signal-info" />
                HLA Histocompatibility Locus Alignment (5-Locus Crossmatch)
              </h3>
              <span className="text-emerald-500 font-mono text-xs font-bold">5/5 COMPATIBLE</span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
              {['HLA-A', 'HLA-B', 'HLA-C', 'HLA-DRB1', 'HLA-DQB1'].map((locus, i) => {
                const key = locus.toLowerCase().replace('-', '');
                const dAllele = sampleAllocation.donor.hla[key] || '02, 24';
                const rAllele = sampleAllocation.recipient.hla[key] || '02, 24';
                const isMatch = dAllele === rAllele || dAllele.includes(rAllele.split(',')[0]);

                return (
                  <div key={locus} className="p-2 rounded-xl bg-surface-2 border border-line space-y-1">
                    <span className="text-[10px] text-ink-secondary block font-bold">{locus}</span>
                    <p className="text-[11px] text-ink-primary">D: {dAllele}</p>
                    <p className="text-[11px] text-ink-muted">R: {rAllele}</p>
                    <span className={`text-[10px] font-bold block ${isMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isMatch ? 'MATCH' : 'ACCEPTABLE'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transport Logistics & Chain of Custody */}
          <div className="p-4 rounded-2xl bg-surface-0 border border-line grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-ink-muted text-[10px] block">AIR TRANSIT CARRIER</span>
              <span className="text-ink-primary font-bold">{sampleAllocation.transport.carrier}</span>
            </div>
            <div>
              <span className="text-ink-muted text-[10px] block">COLD-CHAIN TEMPERATURE</span>
              <span className="text-emerald-500 font-bold">{sampleAllocation.transport.podTemp} (Active Perfusion)</span>
            </div>
            <div>
              <span className="text-ink-muted text-[10px] block">CHAIN OF CUSTODY OFFICER</span>
              <span className="text-ink-primary">{sampleAllocation.transport.chainOfCustodyOfficer}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 px-6 border-t border-line flex items-center justify-between bg-surface-0">
          <span className="text-xs font-mono text-ink-muted">
            Official Clinical Record Verified • VitalNode Regulatory Consensus
          </span>
          <button
            onClick={onClose}
            className="btn-primary-action text-xs"
          >
            Dismiss Manifest
          </button>
        </div>
      </div>
    </div>
  );
}
