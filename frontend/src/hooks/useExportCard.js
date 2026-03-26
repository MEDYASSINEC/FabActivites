import { useRef } from 'react';
import html2canvas from 'html2canvas';

export function useExportCard(filename = 'carte') {
    const ref = useRef(null);

    const exportImage = async () => {
        if (!ref.current) return;

        const canvas = await html2canvas(ref.current, {
            backgroundColor: '#ffffff',
            scale: 2,           // double résolution → image nette
            useCORS: true,      // pour les polices/images externes
            logging: false,
        });

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return { ref, exportImage };
}