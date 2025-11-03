import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const SCRIPT_ID = 'google-identity-services';

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  disabled = false,
  onCredential,
  onError,
  className,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      return;
    }

    let cancelled = false;

    const initializeButton = () => {
      if (cancelled) return;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
      
      // Debug: Log env variable (remove in production)
      console.log('[GoogleSignIn] Environment check:', {
        hasClientId: !!clientId,
        clientIdLength: clientId?.length || 0,
        clientIdPrefix: clientId?.substring(0, 20) || 'N/A',
        allViteEnv: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
      });
      
      if (!clientId) {
        const errorMsg = 'Thiếu VITE_GOOGLE_CLIENT_ID. Vui lòng:\n1. Kiểm tra file .env có VITE_GOOGLE_CLIENT_ID\n2. Restart dev server (npm run dev)\n3. Xem GOOGLE_SIGNIN_SETUP.md';
        console.error('[GoogleSignIn] Missing Client ID. Available env vars:', import.meta.env);
        onError?.(errorMsg);
        return;
      }

      if (!window.google?.accounts?.id) {
        onError?.('Google Identity Services chưa sẵn sàng.');
        return;
      }

      console.log('[GoogleSignIn] Initializing with Client ID:', clientId?.substring(0, 30) + '...');
      console.log('[GoogleSignIn] Current origin:', window.location.origin);
      console.log('[GoogleSignIn] ⚠️ If you see 403 error, check Google Cloud Console:');
      console.log('[GoogleSignIn]    1. Authorized JavaScript origins:', window.location.origin);
      console.log('[GoogleSignIn]    2. Authorized redirect URIs:', window.location.origin);
      console.log('[GoogleSignIn]    3. OAuth consent screen must be published or have test users');
      console.log('[GoogleSignIn]    4. Google Sign-In API must be enabled');
      console.log('[GoogleSignIn]    5. Format must be exact (no trailing slash, no spaces)');
      
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (cancelled) return;
            if (response?.credential) {
              onCredential(response.credential);
            } else {
              onError?.('Phản hồi Google không hợp lệ.');
            }
          },
          ux_mode: 'popup',
          auto_select: false,
        });
        console.log('[GoogleSignIn] Initialization successful');
      } catch (error) {
        console.error('[GoogleSignIn] Initialization error:', error);
        onError?.(`Lỗi khởi tạo Google Sign-In: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
        });
      }
    };

    const handleScriptError = () => {
      if (!cancelled) {
        onError?.('Không thể tải Google Identity Services.');
      }
    };

    const ensureScript = () => {
      if (window.google?.accounts?.id) {
        initializeButton();
        return;
      }

      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (script) {
        script.addEventListener('load', initializeButton, { once: true });
        script.addEventListener('error', handleScriptError, { once: true });
        return;
      }

      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeButton;
      script.onerror = handleScriptError;
      document.head.appendChild(script);
    };

    ensureScript();

    return () => {
      cancelled = true;
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (_error) {
          // ignore
        }
      }
    };
  }, [disabled, onCredential, onError]);

  return (
    <div className={className}>
      <div ref={buttonRef} className={disabled ? 'opacity-50 pointer-events-none' : ''} />
    </div>
  );
};

export default GoogleSignInButton;