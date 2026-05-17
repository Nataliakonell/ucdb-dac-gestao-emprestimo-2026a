import { useEffect } from "react";

export function VLibras() {
  useEffect(() => {
    const scriptSrc = "https://vlibras.gov.br/app/vlibras-plugin.js";
    const widgetSrc = "https://vlibras.gov.br/app";

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.VLibras) {
        // @ts-ignore
        new window.VLibras.Widget(widgetSrc);
      }
    };
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Ignore if already removed
      }
    };
  }, []);

  return (
    // @ts-ignore
    <div vw="true" className="enabled">
      <div vw-access-button="true" className="active"></div>
      <div vw-plugin-wrapper="true">
        <div className="vw-plugin-top-wrapper"></div>
      </div>
    </div>
  );
}
