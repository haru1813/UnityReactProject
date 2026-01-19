import { useEffect, useRef } from 'react';
import './Unity.css';

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: any,
      onProgress?: (progress: number) => void
    ) => Promise<any>;
  }
}

interface UnityProps {
  buildUrl?: string;
  width?: number;
  height?: number;
}

const Unity: React.FC<UnityProps> = ({ 
  buildUrl = '/Build', 
  width = 960, 
  height = 600 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unityInstanceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;

    // 화면 크기에 맞게 캔버스 크기 설정
    const updateCanvasSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.style.maxWidth = '100vw';
      canvas.style.maxHeight = '100vh';
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Unity 로더 스크립트 로드
    const loaderUrl = `${buildUrl}/UnityBuild.loader.js`;
    const script = document.createElement('script');
    script.src = loaderUrl;
    script.async = true;

    script.onload = () => {
      if (!window.createUnityInstance) {
        console.error('Unity loader failed to load');
        return;
      }

      const config = {
        arguments: [],
        dataUrl: `${buildUrl}/UnityBuild.data.gz`,
        frameworkUrl: `${buildUrl}/UnityBuild.framework.js.gz`,
        codeUrl: `${buildUrl}/UnityBuild.wasm.gz`,
        streamingAssetsUrl: 'StreamingAssets',
        companyName: 'DefaultCompany',
        productName: 'UnityReactProject',
        productVersion: '0.1',
        showBanner: (msg: string, type: string) => {
          console.log(`Unity ${type}:`, msg);
        },
        matchWebGLToCanvasSize: true,
      };

      // 로딩 바 표시
      const loadingBar = container.querySelector('#unity-loading-bar') as HTMLElement;
      if (loadingBar) {
        loadingBar.style.display = 'block';
      }

      // Unity 인스턴스 생성
      window.createUnityInstance(canvas, config, (progress: number) => {
        const progressBar = container.querySelector('#unity-progress-bar-full') as HTMLElement;
        if (progressBar) {
          progressBar.style.width = `${100 * progress}%`;
        }
      })
        .then((unityInstance: any) => {
          unityInstanceRef.current = unityInstance;
          
          // 캔버스 크기 다시 설정 (Unity 로드 후)
          updateCanvasSize();
          
          // 로딩 바 숨기기
          if (loadingBar) {
            loadingBar.style.display = 'none';
          }

          // 전체화면 버튼 이벤트
          const fullscreenButton = container.querySelector('#unity-fullscreen-button') as HTMLElement;
          if (fullscreenButton) {
            fullscreenButton.onclick = () => {
              unityInstance.SetFullscreen(1);
            };
          }
        })
        .catch((message: string) => {
          console.error('Unity initialization failed:', message);
          alert(`Unity 로드 실패: ${message}`);
        });
    };

    script.onerror = () => {
      console.error('Failed to load Unity loader script');
    };

    document.body.appendChild(script);

    // 모바일 디바이스 감지 및 스타일 조정
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      container.className = 'unity-mobile';
      canvas.className = 'unity-mobile';
    } else {
      container.className = 'unity-desktop';
    }

    // 정리 함수
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (unityInstanceRef.current) {
        // Unity 인스턴스 정리 (필요한 경우)
        try {
          unityInstanceRef.current.Quit();
        } catch (e) {
          console.log('Unity quit error:', e);
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [buildUrl, width, height]);

  return (
    <div ref={containerRef} id="unity-container" className="unity-desktop">
      <canvas 
        ref={canvasRef} 
        id="unity-canvas" 
        width={typeof window !== 'undefined' ? window.innerWidth : width} 
        height={typeof window !== 'undefined' ? window.innerHeight : height} 
        tabIndex={-1}
      />
      <div id="unity-loading-bar">
        <div id="unity-logo"></div>
        <div id="unity-progress-bar-empty">
          <div id="unity-progress-bar-full"></div>
        </div>
      </div>
      <div id="unity-warning"></div>
      <div id="unity-footer">
        <div id="unity-logo-title-footer"></div>
        <div id="unity-fullscreen-button"></div>
        <div id="unity-build-title">UnityReactProject</div>
      </div>
    </div>
  );
};

export default Unity;

