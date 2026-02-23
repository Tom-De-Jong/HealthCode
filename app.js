const Toast = {
    init() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: '9999'
        });
        document.body.appendChild(this.container);
    },

    show(message = "Notification", type = "error", duration = 3000) {
        if (!this.container) this.init();

        // Define our theme variations
        const types = {
            success: { bg: '#22c55e', border: '#15803d' },
            error:   { bg: '#ef4444', border: '#b91c1c' },
            info:    { bg: '#3b82f6', border: '#1d4ed8' },
            warning: { bg: '#f59e0b', border: '#b45309' }
        };

        // Fallback to error if an invalid type is passed
        const theme = types[type] || types.error;

        const toast = document.createElement('div');
        toast.textContent = message;

        Object.assign(toast.style, {
            backgroundColor: theme.bg,
            borderLeft: `4px solid ${theme.border}`,
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            opacity: '0',
            transition: 'all 0.3s ease',
            transform: 'translateX(20px)'
        });

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 2000);
        }, duration);
    }
};


let barcodeNum;

const html5QrCode = new Html5Qrcode(/* element id */ "reader");
// File based scanning
const fileinput = document.getElementById('qr-input-file');
fileinput.addEventListener('change', e => {
    if (e.target.files.length == 0) {
        // No file selected, ignore 
        return;
    }

    const imageFile = e.target.files[0];
    // Scan QR Code
    html5QrCode.scanFile(imageFile, true)
        .then(decodedText => {
            // success, use decodedText
            barcodeNum = decodedText;
        })
        .catch(err => {
            // failure, handle it.
            console.log(`Error scanning file. Reason: ${err}`)
        });
});


console.log(barcodeNum);



function sendToApi() {
    let apiKey = document.getElementById("hcApiKey").value

    if (barcodeNum != null && apiKey.trim().length > 0) {
        let data;

        fetch(`https://world.openfoodfacts.org/api/v2/product/${barcodeNum}.json?lc=nl&fields=product_name,ingredients_text,image_url`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        })
            .then(response => response.json())
            .then(response => {
                data = response;

                console.log(data)

                if (data.status_verbose == "product found") {
                    console.log("product found")

                    
                } else {
                    console.log("product has not been found")
                }

            })
    } else {
        

        Toast.show("One or both fields not filled in");
    }




}
