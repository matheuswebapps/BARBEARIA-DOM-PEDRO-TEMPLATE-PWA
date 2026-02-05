import React, { useEffect, useMemo, useState } from 'react';
import type { BusinessSettings } from '../types';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const LS_ACK = 'fio_pwa_ack_installed';
const LS_DISMISS_UNTIL = 'fio_pwa_dismiss_until';

const isStandalone = (): boolean => {
  // iOS Safari
  const nav: any = navigator;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone);
};

const isIOS = (): boolean => {
  const ua = navigator.userAgent || '';
  return /iphone|ipad|ipod/i.test(ua);
};

const isMobile = (): boolean => {
  return window.matchMedia('(max-width: 1024px)').matches;
};

export default function PWAInstallPrompt({ settings }: { settings: BusinessSettings }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const canShow = useMemo(() => {
    if (!isMobile()) return false; // NEVER show on desktop
    if (isStandalone()) return false;
    if (localStorage.getItem(LS_ACK) === '1') return false;
    const until = Number(localStorage.getItem(LS_DISMISS_UNTIL) || '0');
    if (until && Date.now() < until) return false;
    return true;
  }, []);

  useEffect(() => {
    if (!canShow) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);

    // If browser doesn't fire beforeinstallprompt (iOS), show premium tutorial.
    const t = window.setTimeout(() => {
      if (!deferred) setVisible(true);
    }, 500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShow]);

  if (!canShow || !visible) return null;

  const onLater = () => {
    // hide for 7 days
    localStorage.setItem(LS_DISMISS_UNTIL, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setVisible(false);
    setShowHelp(false);
  };

  const onAlreadyInstalled = () => {
    localStorage.setItem(LS_ACK, '1');
    setVisible(false);
    setShowHelp(false);
  };

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      const res = await deferred.userChoice;
      if (res.outcome === 'accepted') {
        localStorage.setItem(LS_ACK, '1');
      }
    } finally {
      setDeferred(null);
      setVisible(false);
      setShowHelp(false);
    }
  };

  const title = settings?.name ? `Instalar ${settings.name}` : 'Instalar o App';

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4">
      <div className="max-w-md mx-auto classic-card border border-[#B8860B] bg-[#FDFBF7] p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E5E0D8] bg-white flex items-center justify-center">
            {settings.appIconUrl ? (
              <img src={settings.appIconUrl} alt="App" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400">APP</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">PWA</div>
            <div className="font-serif font-bold text-[#2C1A1D]">{title}</div>
            {showHelp ? (
              <div className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                {isIOS() ? (
                  <>
                    <div className="font-bold text-[#2C1A1D] mb-1">No iPhone/iPad:</div>
                    <ol className="list-decimal ml-4">
                      <li>Toque em <span className="font-bold">Compartilhar</span> (ícone com seta)</li>
                      <li>Escolha <span className="font-bold">Adicionar à Tela de Início</span></li>
                      <li>Confirme em <span className="font-bold">Adicionar</span></li>
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-[#2C1A1D] mb-1">No Android:</div>
                    {deferred ? (
                      <div className="mb-2">Toque em <span className="font-bold">Instalar</span> para instalar automaticamente.</div>
                    ) : (
                      <div className="mb-2">Se o botão <span className="font-bold">Instalar</span> não aparecer:</div>
                    )}
                    <ol className="list-decimal ml-4">
                      <li>Abra o menu do navegador (<span className="font-bold">⋮</span> no canto)</li>
                      <li>Toque em <span className="font-bold">Instalar app</span> ou <span className="font-bold">Adicionar à tela inicial</span></li>
                      <li>Confirme em <span className="font-bold">Adicionar/Instalar</span></li>
                    </ol>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="mt-3 text-[10px] font-bold uppercase text-[#B8860B] hover:underline"
                >
                  Voltar
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-gray-600 mt-2">Abra mais rápido, sem ocupar espaço do navegador.</div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {!isIOS() && deferred ? (
            <button
              onClick={onInstall}
              className="classic-btn px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex-1"
            >
              Instalar
            </button>
          ) : null}

          <button
            onClick={() => setShowHelp(true)}
            className="classic-btn px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex-1"
          >
            Entender
          </button>
          <button
            onClick={onLater}
            className="classic-btn-outline px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex-1"
          >
            Depois
          </button>
          <button
            onClick={onAlreadyInstalled}
            className="text-[10px] font-bold uppercase text-gray-500 hover:underline whitespace-nowrap"
          >
            Já instalei
          </button>
        </div>
      </div>
    </div>
  );
}
