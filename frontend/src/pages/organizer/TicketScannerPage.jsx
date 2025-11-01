import { ArrowUpTrayIcon, CheckCircleIcon, QrCodeIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import jsQR from "jsqr";

const Scanner = () => {
    const [validationStatus, setValidationStatus] = useState(null); // null, 'success', 'error'
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const { translate } = useLanguage();

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file)
            return;

        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Create an invisible canvas
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Get image data and decode QR
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                setTimeout(() => { // Just wasting time
                    if (code && code.data) {
                        console.log(code.data);
                        setValidationStatus('success');
                    }
                    else {
                        setValidationStatus('error');
                    }

                    setIsLoading(false);
                }, 1000);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const resetScanner = () => {
        setValidationStatus(null);
        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    }

    const renderState = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 h-[500px]">
                    <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">{translate("validatingTicket")}</p>
                </div>
            );
        }

        if (validationStatus === 'success') {
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 h-[500px]">
                    <CheckCircleIcon className="w-24 h-24 text-green-500" />
                    <h3 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{translate("ticketValid")}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{translate("ticketValidDescription")}</p>
                    <button onClick={resetScanner} className="mt-6 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                        Scan Next Ticket
                    </button>
                </div>
            );
        }

        if (validationStatus === 'error') {
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 h-[500px]">
                    <XCircleIcon className="w-24 h-24 text-red-500" />
                    <h3 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{translate("invalidTicket")}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{translate("invalidTicketDescription")}</p>
                    <button onClick={resetScanner} className="mt-6 bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors">
                        {translate("tryAgain")}
                    </button>
                </div>
            );
        }

        return (
            <label
                htmlFor="qr-upload"
                className="relative flex flex-col items-center justify-center w-full h-[500px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <QrCodeIcon className="w-24 h-24 text-indigo-600 dark:text-indigo-400 mb-4" />
                    <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">{translate("qrScanner")}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{translate("qrCodeUpload")}</p>
                    <div className="flex items-center gap-2 mt-4 text-indigo-600 dark:text-indigo-400">
                        <ArrowUpTrayIcon className="w-5 h-5" />
                        <span className="font-medium">{translate("uploadAFile")}</span>
                    </div>
                </div>
                <input id="qr-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
            </label>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {renderState()}
        </div>
    );
};

export default function TicketScannerPage() {
    const { translate } = useLanguage();

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{translate("ticketScanner")}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{translate("ticketScannerDescription")}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-300">
                <Scanner />
            </div>
        </>
    );
}
