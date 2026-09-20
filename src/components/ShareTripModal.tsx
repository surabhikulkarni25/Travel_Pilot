import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Globe,
  Lock,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  buildShareUrl,
  enableTripSharing,
  disableTripSharing,
  formatTripSummaryText
} from '../services/shareService';
import type { Trip } from '../types';

interface ShareTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: (updatedTrip: Trip) => void;
}

export function ShareTripModal({
  trip,
  isOpen,
  onClose,
  onTripUpdated
}: ShareTripModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isShared = Boolean(trip.isShared && trip.shareToken);
  const shareUrl = trip.shareToken ? buildShareUrl(trip.shareToken) : '';
  const canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const summaryText = formatTripSummaryText(trip, shareUrl);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setErrorMessage('Could not copy link to clipboard.');
    }
  };

  const handleCopySummary = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summaryText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.error('Failed to copy summary:', err);
      setErrorMessage('Could not copy summary to clipboard.');
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.share({
        title: `${trip.destination} Itinerary Summary • TravelPilot`,
        text: summaryText,
        url: shareUrl
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share error, falling back to copy:', err);
        handleCopyLink();
      }
    }
  };

  const handleEnableSharing = async () => {
    setIsToggling(true);
    setErrorMessage(null);
    try {
      const { shareToken } = await enableTripSharing(trip);
      const updated: Trip = {
        ...trip,
        isShared: true,
        shareToken,
        updatedAt: new Date().toISOString()
      };
      onTripUpdated(updated);

      // Attempt native share if supported
      if (canWebShare) {
        const url = buildShareUrl(shareToken);
        const textWithUrl = formatTripSummaryText(updated, url);
        try {
          await navigator.share({
            title: `${trip.destination} Itinerary Summary • TravelPilot`,
            text: textWithUrl,
            url
          });
        } catch {
          // Ignore cancellation
        }
      }
    } catch (err: any) {
      console.error('Error enabling sharing:', err);
      setErrorMessage('Failed to enable trip sharing. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDisableSharing = async () => {
    setIsToggling(true);
    setErrorMessage(null);
    try {
      await disableTripSharing(trip.id, trip.shareToken);
      const updated: Trip = {
        ...trip,
        isShared: false,
        updatedAt: new Date().toISOString()
      };
      onTripUpdated(updated);
    } catch (err: any) {
      console.error('Error disabling sharing:', err);
      setErrorMessage('Failed to disable sharing. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      id="share-trip-modal-overlay"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="share-trip-modal"
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E7E2D9] shadow-xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#576574] hover:text-[#1A202C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
              Share Itinerary Summary
            </h3>
            <p className="text-xs font-mono-meta text-[#576574]">
              {trip.destination}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#F9EFEA] border border-[#D96B43]/20 text-[#D96B43] text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mb-4 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isShared ? 'bg-emerald-500 animate-pulse' : 'bg-[#576574]'
              }`}
            />
            <span className="font-mono-meta text-xs font-semibold uppercase tracking-wider text-[#1A202C]">
              Sharing: {isShared ? 'Active' : 'Turned Off'}
            </span>
          </div>
          <span className="text-[11px] text-[#576574]">
            {isShared ? 'Summary link is live' : 'Only you can view'}
          </span>
        </div>

        {isShared ? (
          <div className="space-y-4">
            <p className="text-xs text-[#576574] leading-relaxed">
              Anyone with this link sees a clean, streamlined <strong>summary of the itinerary</strong> with dates, stay details, daily stops, Google Maps links, and estimated budget. No account required.
            </p>

            {/* Quick Share Summary Preview */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono-meta text-[#576574] uppercase">
                <span className="flex items-center gap-1 font-semibold text-[#1D4E4F]">
                  <Sparkles className="w-3 h-3" />
                  What will be shared
                </span>
                <span>{trip.days?.length || 0} Days</span>
              </div>
              <p className="font-medium text-[#1A202C] line-clamp-1">
                {trip.destination} • {trip.startDate} to {trip.endDate}
              </p>
              {trip.accommodation?.hotel?.name && (
                <p className="text-[#576574] text-[11px] line-clamp-1">
                  🏨 Stay: {trip.accommodation.hotel.name}
                </p>
              )}
              <p className="text-[11px] text-[#576574] line-clamp-2">
                Stops: {(trip.days || [])
                  .flatMap((d) => (d.items || []).filter((i) => !i.isRejected).map((i) => i.title))
                  .slice(0, 4)
                  .join(' • ')}...
              </p>
            </div>

            {/* Link Box */}
            <div className="space-y-1.5">
              <label className="font-mono-meta text-[11px] uppercase text-[#576574] block">
                Itinerary Summary Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl px-3.5 py-2.5 text-xs text-[#1A202C] font-mono select-all focus:outline-none focus:border-[#1D4E4F]"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#1D4E4F] hover:bg-[#153B3C] text-white shadow-xs'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Action Buttons: WhatsApp / Apps & Copy Summary */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {canWebShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share to WhatsApp / Apps</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF2F1] border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Summary Copied!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-[#1D4E4F]" />
                    <span>Copy Text Summary</span>
                  </>
                )}
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF2F1] border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#1D4E4F]" />
                <span>Open Summary</span>
              </a>
            </div>

            {copiedSummary && (
              <p className="text-xs text-emerald-700 font-medium flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Summary text & link copied! Paste directly in any chat.</span>
              </p>
            )}

            {/* Disable Sharing Control */}
            <div className="pt-3 border-t border-[#E7E2D9]/80 flex items-center justify-between">
              <span className="text-[11px] text-[#576574]">
                Want to make this private again?
              </span>
              <button
                type="button"
                onClick={handleDisableSharing}
                disabled={isToggling}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E7E2D9] hover:border-[#D96B43]/40 text-xs font-medium text-[#576574] hover:text-[#D96B43] hover:bg-[#F9EFEA] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isToggling ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>Disable Link</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] text-xs text-[#576574] leading-relaxed">
              <p className="mb-2 text-[#1A202C] font-semibold">
                Share a clean summary with friends:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-[#576574]">
                <li>Generates an uncluttered summary link of your itinerary.</li>
                <li>Includes destination, travel dates, stay details, and day-by-day stops.</li>
                <li>Provides 1-tap Google Maps and ride links for every activity.</li>
                <li>Friends can view instantly without needing an account or login.</li>
                <li>Revoke access anytime with one click.</li>
              </ul>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleEnableSharing}
                disabled={isToggling}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>Enable & Get Summary Link</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

