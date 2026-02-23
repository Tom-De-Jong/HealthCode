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
            error: { bg: '#ef4444', border: '#b91c1c' },
            info: { bg: '#3b82f6', border: '#1d4ed8' },
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
    let productName = "";
    let productIngredients = "";

    if (barcodeNum != null) {
        let data;
        Toast.show("Analyzing product. Please wait", "success", 5000);
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
                productName = data.product.product_name;
                productIngredients = data.product.ingredients_text;
                analyzeProduct(productName, productIngredients)

                if (data.status_verbose == "product found") {
                    console.log("product found")



                } else {
                    console.log("product has not been found")
                    Toast.show("No product has been found", "error");
                }

            })
    } else {


        Toast.show("field not filled in");
    }




}

async function analyzeProduct(name, ingred) {
    console.log(name)
    console.log(ingred)
    const API_URL = 'https://cdn.tomwebsites.nl/healthcode/index.php';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "ProductName": name,
                "productIngredients": ingred
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        const healthData = JSON.parse(data.choices[0].message.content);

        console.log("Analysis Received:", healthData);




        document.querySelector("#itemName").innerHTML = name;
        document.querySelector("#ingredientList").innerHTML = '<span class="bold">Ingredients</span> ' + ingred;
        document.querySelector("#AISummary").innerHTML = '<span class="bold">AI Summary: </span>' + healthData.summary;
        document.querySelector("#circleProgress").setAttribute('value', healthData.average_healthiness_percentage);

        for (let i = 0; i < healthData.ingredients.length; i++) {
            console.log(healthData.ingredients[i]);

            let ingredientsDiv = document.createElement("div");

            ingredientsDiv.className = "Ingredients ingredient-animate";


            let baseDelay = 0.5;
            ingredientsDiv.style.animationDelay = `${baseDelay + (i * 0.1)}s`;

            let ingredientName = document.createElement("p");
            ingredientName.className = "listText2";
            ingredientName.style = "font-size: 30px; margin-left: 25px;";
            ingredientName.id = "ingredientName";
            ingredientName.innerHTML = healthData.ingredients[i].name;

            let ingredientPercentage = document.createElement("p");
            ingredientPercentage.className = "listText2";
            ingredientPercentage.style = "margin-left: auto; margin-right: 25px; font-size: 40px;";
            ingredientPercentage.id = "ingredientPercentage";
            ingredientPercentage.innerHTML = healthData.ingredients[i].healthiness_percentage + "%";

            ingredientsDiv.appendChild(ingredientName);
            ingredientsDiv.appendChild(ingredientPercentage);
            document.querySelector(".summaryContent").appendChild(ingredientsDiv);
        }

        const summarySection = document.querySelector(".summarySection");
        summarySection.style.display = "flex";


        summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
        Toast.show("Analyzing done!", "success");



    } catch (error) {
        console.error("Fetch failed:", error);
        alert("Could not connect to the health API. Check console for CORS errors.");
    }
}







