import { siteConfig } from "@/config/site.config";
import { t } from "@/i18n";

export function WhatsAppButton() {
  const { whatsapp, whatsappMessage, whatsappLabel } = siteConfig.contact;
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
  const label = whatsappLabel ?? t.whatsapp.defaultLabel;

  return (
    <>
      <style>{`
        @keyframes wa-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.55; }
          80%  { transform: scale(1.9); opacity: 0;    }
          100% { transform: scale(1.9); opacity: 0;    }
        }
        .wa-fab { position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 50; }
        .wa-fab__ring {
          position: absolute; inset: 0; border-radius: 9999px;
          background-color: #25D366;
          animation: wa-pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          transform-origin: center;
          will-change: transform, opacity;
          pointer-events: none;
        }
        .wa-fab__label {
          position: absolute; top: 50%; right: calc(100% + 0.75rem);
          transform: translateY(-50%) translateX(6px);
          opacity: 0; pointer-events: none;
          white-space: nowrap;
          background: rgba(20,20,20,0.92); color: #fff;
          font-size: 0.8rem; padding: 0.4rem 0.7rem; border-radius: 0.5rem;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .wa-fab__btn:hover .wa-fab__label,
        .wa-fab__btn:focus-visible .wa-fab__label {
          opacity: 1; transform: translateY(-50%) translateX(0);
        }
        @media (hover: none) {
          .wa-fab__label { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-fab__ring { animation: none; opacity: 0; }
        }
      `}</style>
      <div className="wa-fab">
        <span className="wa-fab__ring" aria-hidden />
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="wa-fab__btn relative h-14 w-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 inline-flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="wa-fab__label">{label}</span>
          <svg viewBox="0 0 32 32" className="h-7 w-7 translate-x-[-1px] translate-y-[1px]" fill="currentColor" aria-hidden>
            <path d="M19.11 17.31c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.14-1.13-.42-2.16-1.33-.8-.71-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.46-.83-2-.22-.53-.44-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.84.14.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.02 4C9.39 4 4 9.39 4 16.02c0 2.12.56 4.18 1.62 5.99L4 28l6.16-1.59a12.02 12.02 0 005.86 1.5h.01c6.63 0 12.02-5.39 12.02-12.02 0-3.21-1.25-6.23-3.52-8.5A12 12 0 0016.02 4zm0 21.93h-.01a9.94 9.94 0 01-5.06-1.39l-.36-.22-3.66.96.98-3.56-.24-.37a9.94 9.94 0 01-1.52-5.32c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.04 7.04 2.92a9.86 9.86 0 012.92 7.05c0 5.5-4.47 9.97-9.97 9.97z" />
          </svg>
        </a>
      </div>
    </>
  );
}
